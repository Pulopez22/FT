// pricing-largeprinting.js - Específico para LARGE FORMAT PRINTING
window.largeFormatPricing = {
    "calendar-vinyl": { 
        "material": 1.25,
        "bubbleFreeBase": 2.00 
    },
    "bubble-free": { 
        "material": 2.50, 
        "specialPrice": 5.75, 
        "maxLimit": 53.5 
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
    "magnet": { "material": 5.50 },
    "adhesive-vinyl": { "material": 3.00 },
    "floor-graphics": { "material": 4.00 },
    "reflective-vinyl": { "material": 6.00 },
    "tshirt-vinyl": { "material": 25.00 },
    "heat-press-vinyl": { "material": 25.00 },
    "backlit-film": { "material": 3.50 },
    "aframe": { "material": 95.67 },
    "window-perf": { "material": 2.50 }
};

/**
 * Función Maestra para Large Format
 * Devuelve un objeto con el precio base por sqft (o unidad) y el cargo fijo
 */
window.getLargeFormatPrice = function(productID, turnVal = "Standard") {
    const isWholesale = localStorage.getItem('userTier') === 'wholesale';
    const multiplier = isWholesale ? 1 : 2;
    const product = window.largeFormatPricing[productID];
    
    if (!product) return { unitPrice: 0, fixedFee: 0, multiplier: multiplier };

    try {
        let basePrice = 0;

        // Caso 1: Productos con precio directo de material (sq/ft)
        if (product.material) {
            basePrice = product.material * multiplier;
        } 
        // Caso 2: Productos con tallas fijas (Gallery Canvas, Table Covers)
        else if (product.sizes) {
            const firstKey = Object.keys(product.sizes)[0];
            basePrice = product.sizes[firstKey] * multiplier;
        }
        // Caso 3: Productos con variantes de material (Wrap cast/calendar)
        else if (product.calendar || product.cast) {
            basePrice = (product.calendar ? product.calendar.material : 3.00) * multiplier;
        }

        let fixedFee = 0;
        // Lógica de cargo por urgencia (Rush)
        if (turnVal.toLowerCase().includes("rush") || turnVal.toLowerCase().includes("same day")) {
            fixedFee = 50.00;
        }

        return {
            unitPrice: basePrice,
            fixedFee: fixedFee,
            multiplier: multiplier 
        };
    } catch (e) {
        console.error("Error calculando precio en Large Printing:", e);
        return { unitPrice: 0, fixedFee: 0, multiplier: multiplier };
    }
};

window.getTierMultiplier = function() {
    return localStorage.getItem('userTier') === 'wholesale' ? 1 : 2;
};