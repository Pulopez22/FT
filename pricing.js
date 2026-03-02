// pricing.js - Archivo Central
const masterPricing = {
    "econo-feather-flag": {
        wholesale: { "flag-only": 73.65, "full-kit": 156.60 },
        retail: { "flag-only": 147.30, "full-kit": 313.20 }
    },
    "custom-pole-flag": {
        wholesale: { "base": 10.00 },
        retail: { "base": 20.00 }
    }
    // Agregaremos los demás productos aquí...
};

function getPrice(productID, hardwareID) {
    const tier = localStorage.getItem('userTier') === 'wholesale' ? 'wholesale' : 'retail';
    return masterPricing[productID][tier][hardwareID];
}