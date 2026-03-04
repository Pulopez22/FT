window.rigidsigns = {
    "PVC": { "material": 3.00, "type": "sqft" },
    "Foamboard": { "material": 3.50, "type": "sqft" },
    "Coroplast": { "material": 3.50, "type": "sqft" },
    "Styrene": { "material": 3.50, "type": "sqft" },
    "Aluminum Signs": { "material": 4.50, "type": "sqft" },
    "Ultraboard": { "material": 5.00, "type": "sqft" },
    "Acrylic": { "material": 10.00, "type": "sqft" },
    "Lexan": { "material": 10.00, "type": "sqft" },
    "Acrylic-art": { "material": 25.00, "type": "sqft" },
    "Aframe": { "material": 95.67, "type": "unit" }
};

window.getLargeFormatPrice = function(productID, turnVal = "Standard") {
    const isWholesale = localStorage.getItem('userTier') === 'wholesale';
    const multiplier = isWholesale ? 1 : 2;
    
    // IMPORTANTE: Buscamos en tu objeto rigidsigns
    // Usamos una lógica para encontrar la clave sin importar mayúsculas
    const key = Object.keys(window.rigidsigns).find(k => k.toLowerCase() === productID.toLowerCase());
    const product = window.rigidsigns[key];
    
    if (!product) return { unitPrice: 0, fixedFee: 0, multiplier: multiplier, type: "sqft" };

    try {
        let basePrice = product.material * multiplier;
        let pType = product.type || "sqft";

        let fixedFee = 0;
        if (turnVal.toLowerCase().includes("rush") || turnVal.toLowerCase().includes("same day") || turnVal === "Next Day") {
            fixedFee = 50.00;
        }

        return {
            unitPrice: basePrice,
            fixedFee: fixedFee,
            multiplier: multiplier,
            type: pType 
        };
    } catch (e) {
        return { unitPrice: 0, fixedFee: 0, multiplier: multiplier, type: "sqft" };
    }
};