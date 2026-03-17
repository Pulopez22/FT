// pricing.js FINAL CORREGIDO
window.bannerPricing = {
    "blockout-fabric": {
        "material": 6.75, 
        "velcro": { "none": 0.00, "1": 1.50, "2": 2.50 },
    },
    "wrinkle-free": {
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
        "material": 3.00,
        "pocket": { "0": 0.00, "1.00": 1.00 },
        "turnaround": { "0": 0.00, "50": 50.00 }
    },
    "mesh-banner": {
        "material": 2.00,
        "turnaround": { "0": 0.00, "50": 50.00 }
    },
    "super-smooth": {
        "material": 1.25,
        "turnaround": { "0": 0.00, "50": 50.00 }
    },
    "standard-banner": {
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
        "material": 6.00, 
        "hem": { "none": 0.00, "hem": 0.50 },
        "pocket": {"none": 0.00, "2in": 1.00, "3in": 1.00 },
        "velcro": { "none": 0.00, "1.50": 1.50, "2.00": 3.00 },
        "turnaround": { "0": 0.00, "50": 50.00 }
    },
    "pole-banners": {
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
function getListProductPrice(productID, sizeKey, turnVal, qty, hardwareKey = "graphic-only") {
    const isWholesale = localStorage.getItem('userTier') === 'wholesale';
    try {
        const product = bannerPricing[productID];
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

function getBannerTotalUnit(productID, options = {}) {
    const { 
        velcroType = null, 
        turnType = "0", 
        hemType = null, 
        pocketType = null, 
        finishingType = null 
    } = options;

    const isWholesale = localStorage.getItem('userTier') === 'wholesale';
    try {
        const product = bannerPricing[productID];
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