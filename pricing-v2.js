// ============================================================
// SQUARE FOOT PRINTING - GLOBAL PRICING
// Centraliza los pricing.js existentes sin cambiar sus fórmulas.
// ============================================================

window.SFP_PRICING_CONFIG = {
    defaultMinimumOrder: 50,
    productionTypes: {
        banners: { label: "Banners", minimumOrder: 50 },
        displays: { label: "Displays", minimumOrder: 50 },
        advertisingFlags: { label: "Advertising Flags", minimumOrder: 50 },
        largePrinting: { label: "Large Printing", minimumOrder: 50 },
        rigidSigns: { label: "Rigid Signs", minimumOrder: 50 },
        stickers: { label: "Stickers", minimumOrder: 50 },
        printedFabric: { label: "Printed Fabric", minimumOrder: 50 }
    }
};

window.SFP_prepareCartItem = function(item, productionType) {
    const typeConfig = window.SFP_PRICING_CONFIG?.productionTypes?.[productionType];
    return {
        ...item,
        productionType: productionType,
        minOrder: Number(item?.minOrder ?? typeConfig?.minimumOrder ?? window.SFP_PRICING_CONFIG?.defaultMinimumOrder ?? 50)
    };
};

// ==================== BANNERS ====================
// pricing.js FINAL CORREGIDO
window.bannerPricing = {
    "blockout-fabric": {
        "startingPrice": 6.00,
        "material": 6.75, 
        "velcro": { "none": 0.00, "1": 1.50, "2": 2.50 },
    },
    "wrinkle-free": {
        "startingPrice": 4.50,
        "material": 0, // El precio base se define por el Hem inicial
        "hem": { 
            "3.00": 3.00, // Trim to Size
            "3.50": 3.50  // Hem All Sides
        },
        "pocket": { 
            "none": 0.00, 
            "2in": 1.00, 
            "3in": 1.00 
        },
        "velcro": { 
            "0": 0.00, 
            "1.50": 1.50, 
            "3.00": 3.00 
        },
        "turnaround": { "0": 0.00, "50": 50.00 }
    },
    "hd-banner-18oz": {
        "startingPrice": 5.00,
        "material": 3.00,
        "pocket": { "0": 0.00, "1.00": 1.00 },
        "turnaround": { "0": 0.00, "50": 50.00 }
    },
    "mesh-banner": {
        "startingPrice": 3.00,
        "material": 2.00,
        "turnaround": { "0": 0.00, "50": 50.00 }
    },
    "super-smooth": {
        "startingPrice": 3.50,
        "material": 1.25,
        "turnaround": { "0": 0.00, "50": 50.00 }
    },
    "standard-banner": {
        "startingPrice": 1.00,
        "material": 0, 
        "finishing": {
            "1.00": 1.00,
            "1.50": 1.50,
            "3.00": 3.00
        }, "pocket": {
            "None": 0.00,
            "3 inch": 1.00 // <-- Aquí sumamos el $1.00 sq/ft
        },
        "turnaround": { "0": 0.00, "50": 50.00 }
    },
    "tension-fabric": {
        "startingPrice": 5.50,
        "material": 6.00, 
        "hem": { "none": 0.00, "hem": 0.50 },
        "pocket": {"none": 0.00, "2in": 1.00, "3in": 1.00 },
        "velcro": { "none": 0.00, "1.50": 1.50, "2.00": 3.00 },
        "turnaround": { "0": 0.00, "50": 50.00 }
    },
    "pole-banners": {
        "startingPrice": 39.34,
        "material": 0,
        "sizes": {
            "18x36": 39.34, "18x60": 65.56, "18x72": 78.67, "18x84": 91.78, "18x96": 104.89,
            "24x36": 52.45, "24x48": 69.93, "24x60": 87.41, "24x72": 104.89, "24x84": 122.37, "24x96": 139.85,
            "30x36": 65.56, "30x48": 87.41, "30x60": 109.26, "30x72": 131.11, "30x84": 152.96, "30x96": 171.66
        },
        "hardware": {
            "full-set": 60.00, "graphic-only": 0.00  },   
        "turnaround": { "0": 0.00, "50": 50.00 }
    }
};

// Ajuste en la función para que busque en la tabla de tamaños
window.getListProductPrice = function(productID, sizeKey, turnVal, qty, hardwareKey = "graphic-only") {
    const isWholesale = localStorage.getItem('userTier') === 'wholesale';
    try {
        const product = window.bannerPricing[productID];
        const basePrice = product.sizes[sizeKey] || 0;
        
        // El hardware lo sumamos fijo al final (sin multiplicador x2 para no inflarlo de más)
        const hardwarePrice = product.hardware ? (product.hardware[hardwareKey] || 0) : 0;
        
        const rushFee = parseFloat(turnVal) || 0; 
        const multiplier = isWholesale ? 1 : 2;
        
        // (Precio base * multiplicador + hardware) * cantidad + Rush
        return ((basePrice * multiplier) + hardwarePrice) * qty + rushFee;
    } catch (e) {
        return 0;
    }
}

window.getBannerTotalUnit = function(productID, options = {}, legacyTurnVal = "0", legacyHemType = null, legacyPocketType = null) {
    // Supports both the current object call and older positional calls.
    if (options === null || typeof options !== "object" || Array.isArray(options)) {
        options = {
            velcroType: options,
            turnType: legacyTurnVal,
            hemType: legacyHemType,
            pocketType: legacyPocketType
        };
    }
    const { 
        velcroType = null, 
        turnType = "0", 
        hemType = null, 
        pocketType = null, 
        finishingType = null 
    } = options;

    const isWholesale = localStorage.getItem('userTier') === 'wholesale';
    try {
        const product = window.bannerPricing[productID];
        if (!product) return { pricePerSqFt: 0, fixedFee: 0 };

        let totalSqFtWholesale = product.material || 0;

        // Sumar extras por sq/ft
        if (velcroType && product.velcro?.[velcroType]) totalSqFtWholesale += product.velcro[velcroType];
        if (hemType && product.hem?.[hemType]) totalSqFtWholesale += product.hem[hemType];
        if (pocketType && product.pocket?.[pocketType]) totalSqFtWholesale += product.pocket[pocketType];
        
        // Agregar el precio del acabado (de tu imagen)
        if (finishingType && product.finishing?.[finishingType]) {
            totalSqFtWholesale += product.finishing[finishingType];
        }

        let fixedFee = 0;
        const fixedFeeProducts = ["wrinkle-free", "hd-banner-18oz", "mesh-banner", "super-smooth", "tension-fabric", "standard-banner"];
        
        if (fixedFeeProducts.includes(productID)) {
            // El Rush Fee es un cargo fijo (ej: $50)
            fixedFee = parseFloat(turnType) || 0;
        } else {
            // El Rush se cobra por sq/ft en otros productos
            totalSqFtWholesale += (product.turnaround ? (product.turnaround[turnType] || 0) : 0);
        }

        // Si es Retail (no wholesale), multiplicamos el precio por sq/ft x2
        const multiplier = isWholesale ? 1 : 2;

        return {
            pricePerSqFt: totalSqFtWholesale * multiplier,
            fixedFee: fixedFee 
        };
    } catch (e) {
        console.error("Error en el cálculo:", e);
        return { pricePerSqFt: 0, fixedFee: 0 };
    }
}

// ==================== DISPLAYS ====================
// pricing.js - CATEGORÍA DISPLAYS
window.displaysPricing = {
    "gallery-canvas": { "material": 29.34 },
    "table-cover": { "material": 120.00 },
    "aframe": { "material": 95.67 },
    "x-stand": {
        "matrix": {
            "24x63": { "13oz": { "Standard": 55.50, "Next Day": 88.50 }, "popup": { "Standard": 72.00, "Next Day": 121.50 } },
            "32x71": { "13oz": { "Standard": 69.00, "Next Day": 94.50 }, "popup": { "Standard": 94.50, "Next Day": 166.50 } }
        }
    },
    "stretchtable": {
        "base": { "6": 140.00, "8": 165.00 },
        "rush": 50.00
    },
    "retractable": {
    "matrix": {
        "24": { "Silver": { "Standard (3-5 Days)": 102.25, "Standard (2 Days)": 160.75 } },
        "33": { 
            "Silver": { "Standard (2 Days)": 106.75, "Next Day": 166.75, "Same Day": 166.75 },
            "Black": { "Standard (2 Days)": 113.75, "Next Day": 234.75 } 
        },
        "36": { "Silver": { "Standard (2 Days)": 139.50, "Next Day": 267.00 } },
        "47": { "Silver": { "Standard (2 Days)": 133.97, "Next Day": 256.26 } },
        "48": { "Silver": { "Standard (3-5 Days)": 225.50, "Standard (2 Days)": 404.00 } },
        "60": { "Silver": { "Standard (2 Days)": 238.50, "Next Day": 454.50 } }
    }
    },
    "tensionstand": {
        "matrix": {
            "Small": { "kit": { "no": 261.00, "yes": 486.00 }, "insert": { "no": 153.00 } },
            "Medium": { "kit": { "no": 269.00, "yes": 494.00 }, "insert": { "no": 137.00 } },
            "Large": {
                "single": { "kit": { "no": 421.88, "yes": 596.25 }, "insert": { "no": 253.13 } },
                "double": { "kit": { "no": 609.38, "yes": 783.75 }, "insert": { "no": 346.88 } }
            },
            "X-Large": {
                "single": { "kit": { "no": 515.63, "yes": 690.00 }, "insert": { "no": 346.88 } },
                "double": { "kit": { "no": 703.13, "yes": 877.50 }, "insert": { "no": 440.63 } }
            }
        }
    },
    "backdrop": { 
        "matrix": {
            "fabric": { "8x8": { "kit": 255, "insert": 218 }, "9x8": { "kit": 255, "insert": 220 }, "10x8": { "kit": 255, "insert": 222 } },
            "vinyl": { "8x8": { "kit": 275, "insert": 129 }, "9x8": { "kit": 275, "insert": 275 }, "10x8": { "kit": 275, "insert": 129 } }
        }
    },
    "eventtent": {
        "base": {
            "full_kit": { "Standard": 492.90, "Quick": 640.00 },
            "canopy_only": { "Standard": 295.00, "Quick": 395.00 }
        },
        "extras": {
            "fullwall": 185.00,
            "halfwall": 145.00,
            "acc": { "none": 0, "bag": 45, "sand": 60, "both": 105 }
        }
    }
};

window.getDisplayPrice = function(productID, opt1, turnVal, opt2 = null, opt3 = null) {
    const isWholesale = localStorage.getItem('userTier') === 'wholesale';
    const multiplier = isWholesale ? 1 : 2;
    const product = window.displaysPricing[productID];
    
    if (!product) return { pricePerSqFt: 0, fixedFee: 0 };

    try {
        let baseWholesale = 0;
        let fixedFee = 0;

        // 1. LÓGICA BACKDROP (NUEVO)
        if (productID === "backdrop") {
    // opt1: material, opt2: size, opt3: type (kit/insert)
    const material = opt1 || "fabric";
    const size = opt2 || "8x8";
    const type = opt3 || "kit";
    
    // Busca en window.displaysPricing.backdrop.matrix
    baseWholesale = product.matrix[material][size][type];
    
    return { pricePerSqFt: baseWholesale * multiplier, fixedFee: 0 };
}

        // 2. LÓGICA STRETCH TABLE (NUEVO)
      if (productID === "stretchtable") {
    const size = (opt1 === "none") ? "6" : opt1; // Busca "6" u "8"
    baseWholesale = product.base[size];
    // Retorna el precio base * multiplicador. El Rush se suma en el HTML.
    return { pricePerSqFt: baseWholesale * multiplier, fixedFee: 0 };
}

        // LÓGICA X-STAND
        if (productID === "x-stand") {
            const size = (opt1 === "none") ? "24x63" : opt1;
            const mat = opt2 || "13oz";
            const turn = (turnVal === "0") ? "Standard" : turnVal;
            baseWholesale = product.matrix[size][mat][turn];
            return { pricePerSqFt: baseWholesale * multiplier, fixedFee: 0 };
        }

        // LÓGICA EZ TUBE
        if (productID === "tensionstand") {
            const size = (opt1 === "none") ? "Small" : opt1;
            const type = opt2 || "kit";
            const led = (opt3 && opt3.led) ? opt3.led : "no";
            
            if (size === "Large" || size === "X-Large") {
                const side = (opt3 && opt3.side) ? opt3.side : "single";
                baseWholesale = product.matrix[size][side][type][type === 'kit' ? led : 'no'];
            } else {
                baseWholesale = product.matrix[size][type][type === 'kit' ? led : 'no'];
            }
            return { pricePerSqFt: baseWholesale * multiplier, fixedFee: 0 };
        }

        // LÓGICA RETRACTABLE
        if (productID === "retractable") {
            const size = (opt1 === "none") ? "33" : opt1;
            const color = opt2 || "Silver";
            const turn = (turnVal === "0") ? "Standard (2 Days)" : turnVal;
            baseWholesale = product.matrix[size][color][turn];
            return { pricePerSqFt: baseWholesale * multiplier, fixedFee: 0 };
        }

        // LÓGICA EVENT TENT
        if (productID === "eventtent") {
    const type = opt1 || "full_kit"; // full_kit o canopy_only
    const turn = turnVal || "Standard"; // Standard o Quick
    const acc = opt2 || "none"; // bag, sand, both
    const walls = opt3 || { fw: 0, hw: 0 }; // Paredes extra

    // 1. Precio Base del Kit desde la matriz
    baseWholesale = product.base[type][turn];

    // 2. Sumar Accesorios (JS busca en product.extras.acc)
    const accPrice = product.extras.acc[acc] || 0;

    // 3. Sumar Paredes (JS busca en product.extras.fullwall y halfwall)
    const wallPrice = (walls.fw * product.extras.fullwall) + (walls.hw * product.extras.halfwall);

    // Retornamos el precio acumulado con el multiplicador retail aplicado al total
    return { pricePerSqFt: (baseWholesale + accPrice + wallPrice) * multiplier, fixedFee: 0 };
}

        // PRODUCTOS SIMPLES (A-Frame, Canvas, Table Cover)
        if (product.material) {
            baseWholesale = product.material;
            return { pricePerSqFt: baseWholesale * multiplier, fixedFee: 0 };
        }

        return { pricePerSqFt: 0, fixedFee: 0 };

    } catch (e) {
        console.error("Error en el cálculo para " + productID, e);
        return { pricePerSqFt: 0, fixedFee: 0 };
    }
};

// ==================== ADVERTISING FLAGS ====================
// pricing.js - Base de Datos Centralizada (Precios Wholesale)
window.masterPricing = {
    "custom-pole-flag": { 
        "base": 10.00,   // Single Sided
        "double": 18.50  // Double Sided
    },
    "teardrop-flag": { "base": 19.17 },
    "feather-angled-flag": { "base": 19.17 },
    "econo-feather-flag": { 
        "flag-only": 73.65, 
        "full-kit": 156.60, 
        "base": 33.32 
    },

    // PRODUCTO: FEATHER ANGLED FLAG PRO
    "feather-angled-flag-pro": {
        // --- SMALL ---
        "small-single-Printed Flag Only (No Hardware)-No": 63.42,
        "small-single-Printed Flag Only (No Hardware)-Yes": 98.36,
        "small-single-Printed Flag + Pole + Ground Stake-No": 112.19,
        "small-single-Printed Flag + Pole + Ground Stake-Yes": 133.97,
        "small-single-Printed Flag + Pole + Cross Base-No": 125.55,
        "small-single-Printed Flag + Pole + Cross Base-Yes": 146.82,
        "small-single-Printed Flag + Pole + Cross Base + Water Bag-No": 134.46,
        "small-single-Printed Flag + Pole + Cross Base + Water Bag-Yes": 155.99,
        "small-single-Printed Flag + Pole + Square Base-No": 138.29,
        "small-single-Printed Flag + Pole + Square Base-Yes": 159.29,
        "small-single-Printed Flag + Pole + Ground Stake + Cross Base-No": 141.35,
        "small-single-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 163.13,
        "small-double-Printed Flag Only (No Hardware)-No": 112.92,
        "small-double-Printed Flag Only (No Hardware)-Yes": 147.86,
        "small-double-Printed Flag + Pole + Ground Stake-No": 161.69,
        "small-double-Printed Flag + Pole + Ground Stake-Yes": 183.47,
        "small-double-Printed Flag + Pole + Cross Base-No": 175.05,
        "small-double-Printed Flag + Pole + Cross Base-Yes": 196.32,
        "small-double-Printed Flag + Pole + Cross Base + Water Bag-No": 183.96,
        "small-double-Printed Flag + Pole + Cross Base + Water Bag-Yes": 205.49,
        "small-double-Printed Flag + Pole + Square Base-No": 187.79,
        "small-double-Printed Flag + Pole + Square Base-Yes": 208.79,
        "small-double-Printed Flag + Pole + Ground Stake + Cross Base-No": 190.85,
        "small-double-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 212.63,
        // --- MEDIUM ---
            "medium-single-Printed Flag Only (No Hardware)-No": 66.59, 
            "medium-single-Printed Flag Only (No Hardware)-Yes": 103.27,
            "medium-single-Printed Flag + Pole + Ground Stake-No": 117.79, 
            "medium-single-Printed Flag + Pole + Ground Stake-Yes": 140.66,
            "medium-single-Printed Flag + Pole + Cross Base-No": 131.83, 
            "medium-single-Printed Flag + Pole + Cross Base-Yes": 154.16,
            "medium-single-Printed Flag + Pole + Cross Base + Water Bag-No": 141.18, 
            "medium-single-Printed Flag + Pole + Cross Base + Water Bag-Yes": 163.78,
            "medium-single-Printed Flag + Pole + Square Base-No": 145.20, 
            "medium-single-Printed Flag + Pole + Square Base-Yes": 167.25,
            "medium-single-Printed Flag + Pole + Ground Stake + Cross Base-No": 148.41, 
            "medium-single-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 171.28,
            "medium-double-Printed Flag Only (No Hardware)-No": 118.57, 
            "medium-double-Printed Flag Only (No Hardware)-Yes": 155.25,
            "medium-double-Printed Flag + Pole + Ground Stake-No": 169.77, 
            "medium-double-Printed Flag + Pole + Ground Stake-Yes": 192.64,
            "medium-double-Printed Flag + Pole + Cross Base-No": 183.80, 
            "medium-double-Printed Flag + Pole + Cross Base-Yes": 206.14,
            "medium-double-Printed Flag + Pole + Cross Base + Water Bag-No": 193.16, 
            "medium-double-Printed Flag + Pole + Cross Base + Water Bag-Yes": 215.76,
            "medium-double-Printed Flag + Pole + Square Base-No": 197.17, 
            "medium-double-Printed Flag + Pole + Square Base-Yes": 219.22,
            "medium-double-Printed Flag + Pole + Ground Stake + Cross Base-No": 200.39, 
            "medium-double-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 223.26,
        // --- LARGE ---
            "large-single-Printed Flag Only (No Hardware)-No": 75.25, 
            "large-single-Printed Flag Only (No Hardware)-Yes": 115.60,
            "large-single-Printed Flag + Pole + Ground Stake-No": 131.57, 
            "large-single-Printed Flag + Pole + Ground Stake-Yes": 156.73,
            "large-single-Printed Flag + Pole + Cross Base-No": 147.01, 
            "large-single-Printed Flag + Pole + Cross Base-Yes": 171.58,
            "large-single-Printed Flag + Pole + Cross Base + Water Bag-No": 157.30, 
            "large-single-Printed Flag + Pole + Cross Base + Water Bag-Yes": 182.16,
            "large-single-Printed Flag + Pole + Square Base-No": 161.72, 
            "large-single-Printed Flag + Pole + Square Base-Yes": 185.97,
            "large-single-Printed Flag + Pole + Ground Stake + Cross Base-No": 165.25, 
            "large-single-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 190.41   ,
            "large-double-Printed Flag Only (No Hardware)-No": 132.42, 
            "large-double-Printed Flag Only (No Hardware)-Yes": 172.77,
            "large-double-Printed Flag + Pole + Ground Stake-No": 188.75, 
            "large-double-Printed Flag + Pole + Ground Stake-Yes": 213.90,
            "large-double-Printed Flag + Pole + Cross Base-No": 204.18, 
            "large-double-Printed Flag + Pole + Cross Base-Yes": 228.75,
            "large-double-Printed Flag + Pole + Cross Base + Water Bag-No": 214.47, 
            "large-double-Printed Flag + Pole + Cross Base + Water Bag-Yes": 239.34,
            "large-double-Printed Flag + Pole + Square Base-No": 218.89, 
            "large-double-Printed Flag + Pole + Square Base-Yes": 243.15,
            "large-double-Printed Flag + Pole + Ground Stake + Cross Base-No": 190.85, 
            "large-double-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 247.58,
        // --- X-LARGE ---
        "xlarge-single-Printed Flag Only (No Hardware)-No": 154.26, 
        "xlarge-single-Printed Flag Only (No Hardware)-Yes": 236.98,
        "xlarge-single-Printed Flag + Pole + Ground Stake-No": 269.73, 
        "xlarge-single-Printed Flag + Pole + Ground Stake-Yes": 390.34,
        "xlarge-single-Printed Flag + Pole + Cross Base-No": 301.37, 
        "xlarge-single-Printed Flag + Pole + Cross Base-Yes": 351.73,
        "xlarge-single-Printed Flag + Pole + Cross Base + Water Bag-No": 322.47, 
        "xlarge-single-Printed Flag + Pole + Cross Base + Water Bag-Yes": 373.43,
        "xlarge-single-Printed Flag + Pole + Square Base-No": 331.52, 
        "xlarge-single-Printed Flag + Pole + Square Base-Yes": 381.25,
        "xlarge-single-Printed Flag + Pole + Ground Stake + Cross Base-No": 338.77, 
        "xlarge-single-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 390.34,
        "xlarge-double-Printed Flag Only (No Hardware)-No": 271.47, 
        "xlarge-double-Printed Flag Only (No Hardware)-Yes": 354.18,
        "xlarge-double-Printed Flag + Pole + Ground Stake-No": 386.93, 
        "xlarge-double-Printed Flag + Pole + Ground Stake-Yes": 438.50,
        "xlarge-double-Printed Flag + Pole + Cross Base-No": 418.57, 
        "xlarge-double-Printed Flag + Pole + Cross Base-Yes": 468.94,
        "xlarge-double-Printed Flag + Pole + Cross Base + Water Bag-No": 439.67, 
        "xlarge-double-Printed Flag + Pole + Cross Base + Water Bag-Yes": 490.64,
        "xlarge-double-Printed Flag + Pole + Square Base-No": 448.73, 
        "xlarge-double-Printed Flag + Pole + Square Base-Yes": 498.45,
        "xlarge-double-Printed Flag + Pole + Ground Stake + Cross Base-No": 455.97, 
        "xlarge-double-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 507.54,
    },

    // PRODUCTO: TEAR DROP FLAG PRO
    "teardrop-flag-pro": {
        // --- SMALL ---
        "small-single-Printed Flag Only (No Hardware)-No": 63.42,
        "small-single-Printed Flag Only (No Hardware)-Yes": 98.36,
        "small-single-Printed Flag + Pole + Ground Stake-No": 112.19,
        "small-single-Printed Flag + Pole + Ground Stake-Yes": 133.97,
        "small-single-Printed Flag + Pole + Cross Base-No": 125.55,
        "small-single-Printed Flag + Pole + Cross Base-Yes": 146.82,
        "small-single-Printed Flag + Pole + Cross Base + Water Bag-No": 134.46,
        "small-single-Printed Flag + Pole + Cross Base + Water Bag-Yes": 155.99,
        "small-single-Printed Flag + Pole + Square Base-No": 138.29,
        "small-single-Printed Flag + Pole + Square Base-Yes": 159.29,
        "small-single-Printed Flag + Pole + Ground Stake + Cross Base-No": 141.35,
        "small-single-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 163.13,
        "small-double-Printed Flag Only (No Hardware)-No": 112.92,
        "small-double-Printed Flag Only (No Hardware)-Yes": 147.86,
        "small-double-Printed Flag + Pole + Ground Stake-No": 161.69,
        "small-double-Printed Flag + Pole + Ground Stake-Yes": 183.47,
        "small-double-Printed Flag + Pole + Cross Base-No": 175.05,
        "small-double-Printed Flag + Pole + Cross Base-Yes": 196.32,
        "small-double-Printed Flag + Pole + Cross Base + Water Bag-No": 183.96,
        "small-double-Printed Flag + Pole + Cross Base + Water Bag-Yes": 205.49,
        "small-double-Printed Flag + Pole + Square Base-No": 187.79,
        "small-double-Printed Flag + Pole + Square Base-Yes": 208.79,
        "small-double-Printed Flag + Pole + Ground Stake + Cross Base-No": 190.85,
        "small-double-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 212.63,
        // --- MEDIUM ---
            "medium-single-Printed Flag Only (No Hardware)-No": 66.59, 
            "medium-single-Printed Flag Only (No Hardware)-Yes": 103.27,
            "medium-single-Printed Flag + Pole + Ground Stake-No": 117.79, 
            "medium-single-Printed Flag + Pole + Ground Stake-Yes": 140.66,
            "medium-single-Printed Flag + Pole + Cross Base-No": 131.83, 
            "medium-single-Printed Flag + Pole + Cross Base-Yes": 154.16,
            "medium-single-Printed Flag + Pole + Cross Base + Water Bag-No": 141.18, 
            "medium-single-Printed Flag + Pole + Cross Base + Water Bag-Yes": 163.78,
            "medium-single-Printed Flag + Pole + Square Base-No": 145.20, 
            "medium-single-Printed Flag + Pole + Square Base-Yes": 167.25,
            "medium-single-Printed Flag + Pole + Ground Stake + Cross Base-No": 148.41, 
            "medium-single-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 171.28,
            "medium-double-Printed Flag Only (No Hardware)-No": 118.57, 
            "medium-double-Printed Flag Only (No Hardware)-Yes": 155.25,
            "medium-double-Printed Flag + Pole + Ground Stake-No": 169.77, 
            "medium-double-Printed Flag + Pole + Ground Stake-Yes": 192.64,
            "medium-double-Printed Flag + Pole + Cross Base-No": 183.80, 
            "medium-double-Printed Flag + Pole + Cross Base-Yes": 206.14,
            "medium-double-Printed Flag + Pole + Cross Base + Water Bag-No": 193.16, 
            "medium-double-Printed Flag + Pole + Cross Base + Water Bag-Yes": 215.76,
            "medium-double-Printed Flag + Pole + Square Base-No": 197.17, 
            "medium-double-Printed Flag + Pole + Square Base-Yes": 219.22,
            "medium-double-Printed Flag + Pole + Ground Stake + Cross Base-No": 200.39, 
            "medium-double-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 223.26,
        // --- LARGE ---
            "large-single-Printed Flag Only (No Hardware)-No": 75.25, 
            "large-single-Printed Flag Only (No Hardware)-Yes": 115.60,
            "large-single-Printed Flag + Pole + Ground Stake-No": 131.57, 
            "large-single-Printed Flag + Pole + Ground Stake-Yes": 156.73,
            "large-single-Printed Flag + Pole + Cross Base-No": 147.01, 
            "large-single-Printed Flag + Pole + Cross Base-Yes": 171.58,
            "large-single-Printed Flag + Pole + Cross Base + Water Bag-No": 157.30, 
            "large-single-Printed Flag + Pole + Cross Base + Water Bag-Yes": 182.16,
            "large-single-Printed Flag + Pole + Square Base-No": 161.72, 
            "large-single-Printed Flag + Pole + Square Base-Yes": 185.97,
            "large-single-Printed Flag + Pole + Ground Stake + Cross Base-No": 165.25, 
            "large-single-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 190.41   ,
            "large-double-Printed Flag Only (No Hardware)-No": 132.42, 
            "large-double-Printed Flag Only (No Hardware)-Yes": 172.77,
            "large-double-Printed Flag + Pole + Ground Stake-No": 188.75, 
            "large-double-Printed Flag + Pole + Ground Stake-Yes": 213.90,
            "large-double-Printed Flag + Pole + Cross Base-No": 204.18, 
            "large-double-Printed Flag + Pole + Cross Base-Yes": 228.75,
            "large-double-Printed Flag + Pole + Cross Base + Water Bag-No": 214.47, 
            "large-double-Printed Flag + Pole + Cross Base + Water Bag-Yes": 239.34,
            "large-double-Printed Flag + Pole + Square Base-No": 218.89, 
            "large-double-Printed Flag + Pole + Square Base-Yes": 243.15,
            "large-double-Printed Flag + Pole + Ground Stake + Cross Base-No": 190.85, 
            "large-double-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 247.58,
        // --- X-LARGE ---
        "xlarge-single-Printed Flag Only (No Hardware)-No": 154.26, 
        "xlarge-single-Printed Flag Only (No Hardware)-Yes": 236.98,
        "xlarge-single-Printed Flag + Pole + Ground Stake-No": 269.73, 
        "xlarge-single-Printed Flag + Pole + Ground Stake-Yes": 390.34,
        "xlarge-single-Printed Flag + Pole + Cross Base-No": 301.37, 
        "xlarge-single-Printed Flag + Pole + Cross Base-Yes": 351.73,
        "xlarge-single-Printed Flag + Pole + Cross Base + Water Bag-No": 322.47, 
        "xlarge-single-Printed Flag + Pole + Cross Base + Water Bag-Yes": 373.43,
        "xlarge-single-Printed Flag + Pole + Square Base-No": 331.52, 
        "xlarge-single-Printed Flag + Pole + Square Base-Yes": 381.25,
        "xlarge-single-Printed Flag + Pole + Ground Stake + Cross Base-No": 338.77, 
        "xlarge-single-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 390.34,
        "xlarge-double-Printed Flag Only (No Hardware)-No": 271.47, 
        "xlarge-double-Printed Flag Only (No Hardware)-Yes": 354.18,
        "xlarge-double-Printed Flag + Pole + Ground Stake-No": 386.93, 
        "xlarge-double-Printed Flag + Pole + Ground Stake-Yes": 438.50,
        "xlarge-double-Printed Flag + Pole + Cross Base-No": 418.57, 
        "xlarge-double-Printed Flag + Pole + Cross Base-Yes": 468.94,
        "xlarge-double-Printed Flag + Pole + Cross Base + Water Bag-No": 439.67, 
        "xlarge-double-Printed Flag + Pole + Cross Base + Water Bag-Yes": 490.64,
        "xlarge-double-Printed Flag + Pole + Square Base-No": 448.73, 
        "xlarge-double-Printed Flag + Pole + Square Base-Yes": 498.45,
        "xlarge-double-Printed Flag + Pole + Ground Stake + Cross Base-No": 455.97, 
        "xlarge-double-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 507.54,
    },
};

/**
 * Función global para obtener precios
 * @param {string} productID - ID del producto
 * @param {string} key - Llave combinada o ID de herraje
 */
function getPrice(productID, key = 'base') {
    const isWholesale = localStorage.getItem('userTier') === 'wholesale';
    
    try {
        const basePrice = masterPricing[productID][key];

        if (basePrice !== undefined) {
            // Si el perfil NO es wholesale, multiplica el precio de la base de datos por 2
            return isWholesale ? basePrice : (basePrice * 2);
        } else {
            console.warn(`Combinación "${key}" no encontrada para el producto: ${productID}`);
            return 0;
        }
    } catch (e) {
        console.error("Error crítico en pricing.js para el producto:", productID, e);
        return 0;
    }
}

// ==================== LARGE PRINTING ====================
// pricing-largeprinting.js - Específico para LARGE FORMAT PRINTING
window.largeFormatPricing = {
    "calendar-vinyl": { 
        "material": 1.25,
        "lamination": { "0": 0, "1.00": 1.00 }, // UV Gloss/Matte
        "finishing": { "0": 0, "1.00": 1.00, "1.50": 1.50 } // Flex/Contour
    },
    "bubble-free": { 
        "material": 2.50,
        "lamination": { "0": 0, ".75": 0.75 },
        "finishing": { "0": 0, ".75": 0.75, "SPECIAL": 5.75 }
    },
    "window-cling": {
        "materials": {
            "matte": 2.50,
            "clear": 4.50,
            "double-matte": 12.00
        }
    },
    "wrap-adhesive": {
        "cast": { "material": 4.00, "THRU": 4.75, "CONTOUR": 35.00, "TRIM": 4.00 },
        "calendar": { "material": 3.00, "THRU": 3.75, "CONTOUR": 27.75, "TRIM": 3.00 }
    },
    "rough-wall": { "material": 2.50 },
    "posters": {
        "material": 2.00,
        "types": {
            "paper": 2.00,
            "popup": 3.75
        }
    },
    "gallery-canvas": {
        "sizes": {
            "8x10": 29.34,
            "11x14": 31.56,
            "12x12": 31.43,
            "12x16": 33.05,
            "12x18": 33.69,
            "16x16": 34.82,
            "16x20": 36.17,
            "16x24": 39.27,
            "24x24": 42.38,
            "24x36": 52.32,
            "32x48": 81.59
        }
    },
    "phototex": { "material": 2.50 },
    "table-cover": {
        "sizes": {
            "4-3": 105.75, 
            "6-3": 125.75, 
            "8-3": 146.66, 
            "4-4": 141.75, 
            "6-4": 161.75, 
            "8-4": 191.75  
        }
    },
    "glass-adhere": { "material": 2.50 },
    "magnet": { 
    "material": 5.50,
    "lamination": { 
        "0": 0, 
        "0.75": 0.75 
    },
    "special_finishing": {
        "cut-to-shape": 10
    }
},
    "adhesive-vinyl": { "material": 3.00 },
    "floor-graphics": { 
    "material": 4.00, // Precio base Wholesale por sqft
    "lamination": { 
        "included": 0 
    },
    "finishing": { 
        "0": 0,         // Trim to Size
        "0.75": 0.75    // Contour Cut
    }
},
    "reflective-vinyl": { 
    "material": 6.00, 
    "lamination": { 
        "gloss": 0.75, 
        "matte": 0.75 
    },
    "finishing": { 
        "0": 0, 
        "0.75": 0.75 
    }
},
    "heat-press-vinyl": { 
    "material": 25.00, 
    "application": { 
        "0": 0, 
        "5": 5.00 
    }
},
    "heat-press-vinyl": { "material": 25.00 },
  "backlit-film": { 
    "material": 3.50, 
    "finishing": { "0": 0, "2.25": 0 } // Ponemos 0 en el valor del extra por si acaso
},
    "aframe": { "material": 95.67 },
    "window-perf": { 
    "material": 2.50,
    "lamination": { "0": 0, "3.25": 3.25 }
}
};

window.getLargeFormatPrice = function(productID, options = {}) {
    const isWholesale = localStorage.getItem('userTier') === 'wholesale';
    const multiplier = isWholesale ? 1 : 2;
    const product = window.largeFormatPricing[productID];
    const turnVal = options.turn || "Standard";
    
    if (!product) return { unitPrice: 0, fixedFee: 0, multiplier: multiplier };

    let baseRate = 0;

    // 1. CASO POSTERS (Busca dentro de .types)
    if (options.type && product.types && product.types[options.type]) {
        baseRate = product.types[options.type];
    }
    // 2. CASO WINDOW CLING (Busca dentro de .materials)
    else if (options.materialKey && product.materials && product.materials[options.materialKey]) {
        baseRate = product.materials[options.materialKey];
    }
    // 3. CASO ESTÁNDAR (Busca .material directo como Rough Wall o Window Perf)
    else if (product.material) {
        baseRate = product.material;
    }

    // --- SUMAR LAMINACIÓN ---
    if (options.lam && product.lamination && product.lamination[options.lam] !== undefined) {
        baseRate += parseFloat(product.lamination[options.lam]);
    }

    let fixedFee = 0;
    if (turnVal === "Rush" || turnVal === "50" || turnVal.toLowerCase().includes("rush")) {
        fixedFee = 50.00;
    }

    return {
        unitPrice: baseRate * multiplier, 
        fixedFee: fixedFee,
        multiplier: multiplier 
    };
};

window.getTierMultiplier = function() {
    return localStorage.getItem('userTier') === 'wholesale' ? 1 : 2;
};

// ==================== RIGID SIGNS ====================
window.rigidsigns = {
    "PVC": {
        "material": 3.00,
        "type": "sqft",
        "variants": { "1mm": 0, "3mm": 1.25, "6mm": 3.25 }, // Diferencia sobre el base
        "options": { "uv_gloss": 1.00, "uv_matte": 1.00 },
        "doubleSidedMultiplier": 1.75
    },
    "Foamboard": {
        "material": 3.50,
        "type": "sqft",
        "variants": { "3/16": 0, "1/2": 2.50 },
        "options": { "uv": 0.75, "dry-erase": 3.00 },
        "doubleSidedMultiplier": 1.75
    },
    "Coroplast": { 
        "material": 3.50, 
        "type": "sqft",
        "variants": { "4mm": 0, "10mm": 2.50 }
    },
    "Aluminum Signs": { 
        "material": 4.50, 
        "type": "sqft",
        "variants": { 
            "white_alum": 3.00, // Upcharge sobre base para sólido
            "die_bond": 0,      // Base es compuesto
            '1/8" (3mm) Composite': 0,
            '1/4" (6mm) Composite': 4.50,
            '0.040" Solid': 3.00,
            '0.063" Solid': 5.00,
            '0.080" Solid': 7.00
        },
        "options": { "uv_gloss": 1.50, "uv_matte": 1.50 },
        "doubleSidedMultiplier": 1.75
    },
    "Aframe": { "material": 95.67, "type": "unit" },
    "Acrylic": {
    "material": 10, 
    "type": "sqft",
    "variants": { 
        // Precios por sqft según material y grosor (Wholesale)
        "white_1/8": 12.00,
        "white_3/16": 14.00,
        "clear_1/8": 15.00,
        "clear_3/16": 17.00,
        "blackout_3/16": 23.00,
        "backlit_white_1/8": 18.00,
        "backlit_white_3/16": 21.00,
        "backlit_clear_3/16": 28.00
    },
    "options": { 
        "router": 2.50, // Router Cut to Shape
        "trim": 0       // Trim to size (Gratis)
    },
    "doubleSidedMultiplier": 1.50 // Double Sided (+50%)
},
    "Styrene": {
    "material": 3.50, // Base .020 Wholesale
    "type": "sqft",
    "variants": { 
        "0.020": 0, 
        "0.040": 1.25, 
        "0.060": 2.50 
    },
    "options": { 
        "uv_gloss": 1.00, 
        "uv_matte": 1.00 
    },
    "doubleSidedMultiplier": 1.50 // Un 50% extra como en los otros
},
    "Ultraboard": {
    "material": 5.00, // Precio base Wholesale
    "type": "sqft",
    "variants": { 
        "ultra": 0, 
        "gator": 1.50, // Gator suele ser más caro
        "3/16": 0,
        "1/2": 2.50 
    },
    "options": { "uv": 1.25 },
    "doubleSidedMultiplier": 1.75
},
    "Lexan": {
    "material": 12,
    "type": "sqft",
    "variants": {
        "white_1/8": 12.00,
        "white_3/16": 14.00,
        "clear_1/8": 15.00,
        "clear_3/16": 17.00,
        "blackout_1/8": 18.00,
        "blackout_3/16": 20.00,
        "backlit_white_0.060": 16.00,
        "backlit_white_1/8": 18.00,
        "backlit_white_3/16": 21.00,
        "backlit_clear_0.060": 22.00,
        "backlit_clear_1/8": 24.00,
        "backlit_clear_3/16": 28.00
    }
},
"Acrylic-art": {
    "material": 25.00, // Precio base Wholesale por sqft
    "type": "sqft",
    "options": {
        "black": 10.00 // Upcharge por stand-offs negros
    }
},
"Aframe": {
    "material": 95.67,
    "type": "unit",
    "options": {
        "deluxe_frame": 25.22,
        "reflective_vinyl": 95.81,
        "reflective_coro": 73.00,
        "lam_vinyl": 5.91,
        "lam_coro": 4.50
    }
}
};

window.getRigidSignPrice = function(productID, turnVal = "Standard", variant = "base", option = "none") {
    const isWholesale = localStorage.getItem('userTier') === 'wholesale';
    const multiplier = isWholesale ? 1 : 2; 
    
    const searchID = productID.toUpperCase().trim();
    const key = Object.keys(window.rigidsigns).find(k => k.toUpperCase() === searchID);
    const product = window.rigidsigns[key];
    
    if (!product) return { unitPrice: 0, fixedFee: 0, multiplier: multiplier };

    try {
        // --- CAMBIO AQUÍ ---
        let basePrice = 0;

        // Si el precio de material es 0 (como en Acrylic), la variante manda el precio total
        if (product.material === 0) {
            basePrice = (product.variants && product.variants[variant] !== undefined) 
                        ? product.variants[variant] 
                        : 0;
        } else {
            // Para productos normales (PVC, Styrene), sumamos material + variante
            basePrice = product.material;
            if (product.variants && product.variants[variant] !== undefined) {
                basePrice += product.variants[variant];
            }
        }
        // -------------------

        // 3. Sumar Opciones (Laminación o Upcharges como Router Cut)
        if (product.options && product.options[option] !== undefined) {
            basePrice += product.options[option];
        }
        
        // 4. Aplicar Multiplicador de Tier (Wholesale x1 / Retail x2)
        let finalUnitPrice = basePrice * multiplier;

        // 5. Cargo fijo por Rush (50.00)
        let fixedFee = 0;
        const rushTerms = ["rush", "same day", "next day"];
        if (rushTerms.some(term => turnVal.toLowerCase().includes(term))) {
            fixedFee = 50.00;
        }

        return {
            unitPrice: finalUnitPrice, 
            fixedFee: fixedFee,  
            multiplier: multiplier,
            rawProductData: product
        };
    } catch (e) {
        return { unitPrice: 0, fixedFee: 0, multiplier: multiplier };
    }
};

// ==================== STICKERS ====================
window.stickerPricing = {
    "custom-sticker": {
        suffix: "sq/ft",
        minOrder: 50,

        material: {
            matte: 2.00,
            gloss: 2.75,
            clear: 3.50
        }
    }
};

function getStickerSqftRate(productID, material) {

    const isWholesale = localStorage.getItem('userTier') === 'wholesale';

    const multiplier = isWholesale ? 1 : 2;

    return window.stickerPricing[productID].material[material] * multiplier;
}

function calculateStickerPrice(productID, width, height, qty, material) {
    const rate = getStickerSqftRate(productID, material);
    const sqftEach = (width * height) / 144;
    const subtotal = sqftEach * qty * rate;
    const total = subtotal < 50 ? 50 : subtotal;

    return {
        total,
        subtotal,
        rate,
        sqftEach
    };
};

function updateStickerPreview(shapeText, width, height) {
    const preview = document.getElementById('sticker-preview-shape');
    const icon = document.getElementById('sticker-preview-icon');
    const shapeLabel = document.getElementById('preview-shape-label');
    const sizeLabel = document.getElementById('preview-size-label');

    if (!preview || !icon || !shapeLabel || !sizeLabel) return;

    preview.className = '';

    const maxSize = 130;
    const minSize = 70;
    const ratio = width / height;

    let previewWidth = maxSize;
    let previewHeight = maxSize;

    if (ratio > 1) {
        previewHeight = Math.max(minSize, maxSize / ratio);
    } else if (ratio < 1) {
        previewWidth = Math.max(minSize, maxSize * ratio);
    }

    preview.style.width = `${previewWidth}px`;
    preview.style.height = `${previewHeight}px`;

    const shape = shapeText.toLowerCase();

    if (shape.includes('circle')) {
        preview.classList.add('preview-circle');
        icon.innerText = '';
    } else if (shape.includes('square')) {
        preview.classList.add('preview-square');
        icon.innerText = '';
    } else {
        preview.classList.add('preview-contour');
        icon.innerText = '✂';
    }

    shapeLabel.innerText = shapeText;
    sizeLabel.innerText = `${width}" x ${height}"`;
}

function getSelectedSize() {
    const sizeBtn = document.querySelector('#size-options .item-active');

    if (sizeBtn.innerText.includes('Custom')) {
        return {
            width: parseFloat(document.getElementById('custom-w').value) || 1,
            height: parseFloat(document.getElementById('custom-h').value) || 1
        };
    }

    const match = sizeBtn.innerText.match(/(\d+(?:\.\d+)?)\s*"?\s*x\s*(\d+(?:\.\d+)?)\s*"?/i);

    if (match) {
        return {
            width: parseFloat(match[1]),
            height: parseFloat(match[2])
        };
    }

    return { width: 2, height: 2 };
}

// ============================================================
// LIVE PRICING OVERRIDES - MongoDB / Render
// Loads admin overrides on every storefront page before consumers
// that await SFP_PRICING_READY perform their initial calculation.
// ============================================================
window.SFP_PRICING_OVERRIDES_ENDPOINT =
    'https://ft-f34l.onrender.com/api/pricing-overrides';

window.SFP_PRICING_SOURCES = new Set([
    'SFP_PRICING_CONFIG',
    'bannerPricing',
    'displaysPricing',
    'masterPricing',
    'largeFormatPricing',
    'rigidsigns',
    'stickerPricing'
]);

window.SFP_applyPricingOverride = function(path, value) {
    if (typeof path !== 'string' || !path.trim()) return false;

    const parts = path.split('.');
    const sourceName = parts.shift();
    if (!window.SFP_PRICING_SOURCES.has(sourceName)) return false;

    const blocked = new Set(['__proto__', 'prototype', 'constructor']);
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue < 0) return false;

    function resolveExistingPath(target, remaining) {
        if (!target || typeof target !== 'object' || !remaining.length) return null;

        // Longest existing key first. This supports keys such as 3.00,
        // 0.040" Solid, 1/8" (3mm) Composite, etc.
        for (let take = remaining.length; take >= 1; take--) {
            const key = remaining.slice(0, take).join('.');
            if (blocked.has(key)) continue;
            if (!Object.prototype.hasOwnProperty.call(target, key)) continue;

            if (take === remaining.length) return { target, key };

            const resolved = resolveExistingPath(target[key], remaining.slice(take));
            if (resolved) return resolved;
        }
        return null;
    }

    const resolved = resolveExistingPath(window[sourceName], parts);
    if (!resolved || blocked.has(resolved.key)) return false;

    resolved.target[resolved.key] = numericValue;
    return true;
};

window.SFP_PRICING_READY = (async function() {
    try {
        const response = await fetch(window.SFP_PRICING_OVERRIDES_ENDPOINT, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`Pricing API returned ${response.status}`);
        }

        const data = await response.json();
        const overrides = Array.isArray(data)
            ? data
            : (Array.isArray(data.overrides) ? data.overrides : []);

        let applied = 0;
        overrides.forEach(entry => {
            if (entry && window.SFP_applyPricingOverride(entry.path, entry.value)) {
                applied++;
            }
        });

        console.info(`SFP pricing ready: ${applied} MongoDB override(s) applied.`);

        // Recalculate product pages after live prices arrive.
        setTimeout(() => {
            if (typeof window.calculatePrice === 'function') {
                try { window.calculatePrice(); } catch (error) {
                    console.warn('Pricing loaded, but page recalculation failed.', error);
                }
            }
        }, 0);

        return { ok: true, applied };
    } catch (error) {
        // Storefront remains usable with pricing.js defaults if Render is down.
        console.warn('SFP pricing overrides unavailable; using pricing.js defaults.', error);
        return { ok: false, applied: 0, error };
    }
})();

window.SFP_whenPricingReady = function(callback) {
    return Promise.resolve(window.SFP_PRICING_READY)
        .catch(() => null)
        .then(() => typeof callback === 'function' ? callback() : undefined);
};



// Guarantee that individual product calculators run once more after BOTH
// the page scripts and MongoDB pricing overrides are ready. This avoids the
// initial default-price race on product detail pages.
window.addEventListener('load', async function SFP_recalculateAfterLivePricing() {
    try { await window.SFP_PRICING_READY; } catch (error) {}
    if (typeof window.calculatePrice === 'function') {
        try { window.calculatePrice(); }
        catch (error) { console.warn('Live pricing loaded, but product recalculation failed.', error); }
    }
});
