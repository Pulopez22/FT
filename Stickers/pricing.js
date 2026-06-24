window.stickerPricing = {
    "custom-sticker": {
        suffix: "sq/ft",
        minOrder: 50,

        material: {
            matte: 2.00,
            gloss: 2.75,
            clear: 3.50
        }
    }
};

function getStickerSqftRate(productID, material) {

    const isWholesale = localStorage.getItem('userTier') === 'wholesale';

    const multiplier = isWholesale ? 1 : 2;

    return window.stickerPricing[productID].material[material] * multiplier;
}

function calculateStickerPrice(productID, width, height, qty, material) {
    const rate = getStickerSqftRate(productID, material);
    const sqftEach = (width * height) / 144;
    const subtotal = sqftEach * qty * rate;
    const total = subtotal < 50 ? 50 : subtotal;

    return {
        total,
        subtotal,
        rate,
        sqftEach
    };
}