// pricing-displays.js - Específico para la categoría DISPLAYS
window.displaysPricing = {
    "gallery-canvas": { "material": 29.34 },
    "table-cover": { "material": 120.00 },
    "aframe": { "material": 95.67 },

    // X-STAND: Matriz de Tamaño > Material > Turnaround
    "x-stand": {
        "matrix": {
            "24x63": { "13oz": { "Standard": 55.50, "Next Day": 88.50 }, "popup": { "Standard": 72.00, "Next Day": 121.50 } },
            "32x71": { "13oz": { "Standard": 69.00, "Next Day": 94.50 }, "popup": { "Standard": 94.50, "Next Day": 166.50 } }
        }
    },

    // STRETCH TABLE COVER
    "stretchtable": {
        "base": { "6": 140.00, "8": 165.00 },
        "rush": 50.00
    },
    
    // RETRACTABLE BANNERS
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

    // TENSION STAND (EZ TUBE)
    "tensionstand": {
        "matrix": {
            "Small": { kit: { no: 261.00, yes: 486.00 }, insert: { no: 153.00 } },
            "Medium": { kit: { no: 269.00, yes: 494.00 }, insert: { no: 137.00 } },
            "Large": {
                "single": { kit: { no: 421.88, yes: 596.25 }, insert: { no: 253.13 } },
                "double": { kit: { no: 609.38, yes: 783.75 }, insert: { no: 346.88 } }
            },
            "X-Large": {
                "single": { kit: { no: 515.63, yes: 690.00 }, insert: { no: 346.88 } },
                "double": { kit: { no: 703.13, yes: 877.50 }, insert: { no: 440.63 } }
            }
        }
    },
    
    // BACKDROP (STEP & REPEAT)
    "backdrop": { 
        "matrix": {
            "fabric": { "8x8": { kit: 255, insert: 218 }, "9x8": { kit: 255, insert: 220 }, "10x8": { kit: 255, insert: 222 } },
            "vinyl": { "8x8": { kit: 275, insert: 129 }, "9x8": { kit: 275, insert: 275 }, "10x8": { kit: 275, insert: 129 } }
        }
    },

    // EVENT TENT
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
    const product = window.bannerPricing[productID];
    
    if (!product) return { pricePerSqFt: 0, fixedFee: 0 };

    try {
        let baseWholesale = 0;
        let fixedFee = 0;

        // LÓGICA X-STAND (opt1=size, turnVal=Standard/Next Day, opt2=material)
        if (productID === "x-stand") {
            baseWholesale = product.matrix[opt1][opt2][turnVal];
            return { pricePerSqFt: baseWholesale * multiplier, fixedFee: 0 };
        }

        // LÓGICA EZ TUBE
        if (productID === "tensionstand") {
            const isLarge = (opt1 === "Large" || opt1 === "X-Large");
            if (isLarge) {
                baseWholesale = product.matrix[opt1][opt3.side][opt2][opt2 === 'kit' ? opt3.led : 'no'];
            } else {
                baseWholesale = product.matrix[opt1][opt2][opt2 === 'kit' ? opt3.led : 'no'];
            }
            if (turnVal === "NextDay") fixedFee = 50.00;
            return { pricePerSqFt: baseWholesale * multiplier, fixedFee: fixedFee };
        }

        // LÓGICA STRETCH TABLE
        if (productID === "stretchtable") {
            baseWholesale = product.base[opt1];
            if (turnVal === "Next Day") fixedFee = product.rush;
            return { pricePerSqFt: baseWholesale * multiplier, fixedFee: fixedFee };
        }

        // LÓGICA EVENT TENT
        if (productID === "eventtent") {
            baseWholesale = product.base[opt1][turnVal];
            let extras = (opt2 ? product.extras.acc[opt2] : 0);
            if (opt3) {
                extras += (opt3.fw || 0) * product.extras.fullwall;
                extras += (opt3.hw || 0) * product.extras.halfwall;
            }
            return { pricePerSqFt: (baseWholesale + extras) * multiplier, fixedFee: 0 };
        }

        // LÓGICA BACKDROP
        if (productID === "backdrop") {
            baseWholesale = product.matrix[opt1][opt2][opt3];
            return { pricePerSqFt: baseWholesale * multiplier, fixedFee: parseFloat(turnVal) || 0 };
        }

        // LÓGICA RETRACTABLE
        if (productID === "retractable") {
            baseWholesale = product.matrix[opt1][opt2][turnVal];
            return { pricePerSqFt: baseWholesale * multiplier, fixedFee: 0 };
        }

        // GENERAL (Canvas, A-Frame)
        baseWholesale = product.material || 0;
        return { pricePerSqFt: baseWholesale * multiplier, fixedFee: parseFloat(turnVal) || 0 };

    } catch (e) {
        console.error("Error en el cálculo:", e);
        return { pricePerSqFt: 0, fixedFee: 0 };
    }
};