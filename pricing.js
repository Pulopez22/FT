// pricing.js - Base de datos centralizada (Precios Wholesale)
const masterPricing = {
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

    // Producto Complejo: Llave construida en el HTML
    "feather-angled-flag-pro": {
        // --- SMALL (9ft) ---
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

        // --- MEDIUM (10.5ft) ---
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

        // --- LARGE (14ft) ---
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
        "large-single-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 190.41,
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
        "large-double-Printed Flag + Pole + Ground Stake + Cross Base-No": 222.43,
        "large-double-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 247.58,

        // --- X-LARGE (18ft) ---
        "xlarge-single-Printed Flag Only (No Hardware)-No": 154.26,
        "xlarge-single-Printed Flag Only (No Hardware)-Yes": 236.98,
        "xlarge-single-Printed Flag + Pole + Ground Stake-No": 269.73,
        "xlarge-single-Printed Flag + Pole + Ground Stake-Yes": 321.30,
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
        "xlarge-double-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 507.54
    }
};

/**
 * Función global para obtener precios
 * @param {string} productID - El ID del producto (ej: "custom-pole-flag")
 * @param {string} key - La llave del herraje o combinación (ej: "base" o "small-single...")
 */
function getPrice(productID, key = 'base') {
    const isWholesale = localStorage.getItem('userTier') === 'wholesale';
    
    try {
        const basePrice = masterPricing[productID][key];

        if (basePrice !== undefined) {
            // Devuelve el precio base si es mayorista, o el doble si es minorista
            return isWholesale ? basePrice : (basePrice * 2);
        } else {
            console.warn(`Combinación "${key}" no encontrada para:`, productID);
            return 0;
        }
    } catch (e) {
        console.error("Error en pricing.js para el producto:", productID);
        return 0;
    }
}