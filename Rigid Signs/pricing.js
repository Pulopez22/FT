window.rigidsigns = {
    "PVC": { "material": 3.00, "type": "sqft" },
    "Foamboard": { "material": 3.50, "type": "sqft" },
    "Coroplast": { "material": 3.50, "type": "sqft" },
    "Styrene": { "material": 3.50, "type": "sqft" },
    "Ultraboard": { "material": 5.00, "type": "sqft" },
    "Aluminum Signs": { "material": 4.50, "type": "sqft" },
    "Aframe": { "material": 95.67, "type": "unit" },
    "Acrylicart": { 
        "base": 25.00,
        "material": 25.00, 
        "type": "sqft",
        "variants": {
            "white": 25,       
            "black": 10.00   
        }
    },
    "Acrylic": { 
        "material": 10.00, 
        "type": "sqft",
        "variants": {
            "white": 0,
            "clear": 4.00,
            "blackout": 4.00,
            "backlit_white": 8.00,
            "backlit_clear": 8.00
        },
        "thickness_upcharge": {
            "0.060\"": 0,
            "1/8\"": 2.00,
            "3/16\"": 5.00
        }
    },
    "Lexan": { 
        "material": 12.00, 
        "type": "sqft",
        "variants": {
            "white": 0,
            "clear": 4.00,
            "blackout": 4.00,
            "backlit_white": 6.00,
            "backlit_clear": 6.00
        },
        "thickness_upcharge": {
            "0.060\"": 0,
            "1/8\"": 2.00,
            "3/16\"": 4.00
        }
    }
};

// LA FUNCIÓN DE CÁLCULO SE MANTIENE IGUAL (YA ESTÁ BLINDADA)
window.getLargeFormatPrice = function(productID, turnVal = "Standard", variant = "white", thickness = "1/8\"") {
    const isWholesale = localStorage.getItem('userTier') === 'wholesale';
    const multiplier = isWholesale ? 1 : 2; 
    
    const searchID = productID.toLowerCase().trim();
    const key = Object.keys(window.rigidsigns).find(k => k.toLowerCase() === searchID);
    const product = window.rigidsigns[key];
    
    if (!product) return { unitPrice: 0, fixedFee: 0, multiplier: multiplier, type: "sqft" };

    try {
        let basePrice = product.material;

        if (product.variants && product.variants[variant] !== undefined) {
            basePrice += product.variants[variant];
        }

        if (product.thickness_upcharge && product.thickness_upcharge[thickness] !== undefined) {
            basePrice += product.thickness_upcharge[thickness];
        }

        let finalUnitPrice = basePrice * multiplier;

        let fixedFee = 0;
        const rushTerms = ["rush", "same day", "next day"];
        if (rushTerms.some(term => turnVal.toLowerCase().includes(term))) {
            fixedFee = 50.00;
        }

        return {
            unitPrice: finalUnitPrice, 
            fixedFee: fixedFee,  
            multiplier: multiplier,
            type: product.type || "sqft"
        };
    } catch (e) {
        return { unitPrice: 0, fixedFee: 0, multiplier: multiplier, type: "sqft" };
    }
};