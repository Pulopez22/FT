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

window.getBannerTotalUnit = function(productID, opt1, turnVal, opt2 = null, opt3 = null) {
    const isWholesale = localStorage.getItem('userTier') === 'wholesale';
    const multiplier = isWholesale ? 1 : 2;
    const product = window.displaysPricing[productID];
    
    if (!product) return { pricePerSqFt: 0, fixedFee: 0 };

    try {
        let baseWholesale = 0;
        let fixedFee = 0;

        // 1. LÓGICA BACKDROP (NUEVO)
        if (productID === "backdrop") {
            const material = (opt1 === "none") ? "fabric" : opt1;
            const size = (opt2 === null || opt2 === "none") ? "8x8" : opt2;
            const type = (opt3 === null || opt3 === "none") ? "insert" : opt3;
            baseWholesale = product.matrix[material][size][type];
            return { pricePerSqFt: baseWholesale * multiplier, fixedFee: 0 };
        }

        // 2. LÓGICA STRETCH TABLE (NUEVO)
        if (productID === "stretchtable") {
            const size = (opt1 === "none") ? "6" : opt1;
            baseWholesale = product.base[size];
            if (turnVal === "Next Day") fixedFee = product.rush;
            return { pricePerSqFt: baseWholesale * multiplier, fixedFee: fixedFee };
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
            const type = (opt1 === "none") ? "full_kit" : opt1;
            const turn = (turnVal === "0") ? "Standard" : turnVal;
            baseWholesale = product.base[type][turn];
            return { pricePerSqFt: baseWholesale * multiplier, fixedFee: 0 };
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