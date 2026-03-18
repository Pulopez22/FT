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

window.getLargeFormatPrice = function(productID, turnVal = "Standard", variant = "base", option = "none") {
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