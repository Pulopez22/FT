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