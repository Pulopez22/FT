// Stickers/pricing.js - Base de Datos Centralizada de Stickers (Precios Wholesale)

// Usamos window.stickerPricing para que sea global y acumulativo
window.stickerPricing = window.stickerPricing || {};

window.stickerPricing = {
    "custom-sticker": {
        "material": 0, // No aplica precio por sq/ft directo
        "suffix": "unit",
        // Matriz de precios por cantidad (Precio base Wholesale)
        "quantities": {
            "50": 18.00,
            "100": 26.00,
            "250": 47.50,
            "500": 80.00
        }
    }
};

/**
 * Función global para obtener el precio "Desde" de un sticker
 * @param {string} productID - ID del producto (ej: 'custom-sticker')
 */
function getStickerStartPrice(productID) {
    const isWholesale = localStorage.getItem('userTier') === 'wholesale';
    const multiplier = isWholesale ? 1 : 2;
    
    try {
        const product = window.stickerPricing[productID];
        if (!product) return 0;

        // Obtenemos la primera cantidad disponible (ej: 50)
        const firstQtyKey = Object.keys(product.quantities)[0];
        // Obtenemos el precio Wholesale de esa cantidad (ej: 18.00)
        const baseWholesalePrice = product.quantities[firstQtyKey];
        
        // Retornamos el precio final según el tier del usuario
        return baseWholesalePrice * multiplier;
    } catch (e) {
        console.error("Error obteniendo precio base de sticker:", productID, e);
        return 0;
    }
}