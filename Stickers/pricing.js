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
};

function updateStickerPreview(shapeText, width, height) {
    const preview = document.getElementById('sticker-preview-shape');
    const icon = document.getElementById('sticker-preview-icon');
    const shapeLabel = document.getElementById('preview-shape-label');
    const sizeLabel = document.getElementById('preview-size-label');

    if (!preview || !icon || !shapeLabel || !sizeLabel) return;

    preview.className = '';

    const maxSize = 130;
    const minSize = 70;
    const ratio = width / height;

    let previewWidth = maxSize;
    let previewHeight = maxSize;

    if (ratio > 1) {
        previewHeight = Math.max(minSize, maxSize / ratio);
    } else if (ratio < 1) {
        previewWidth = Math.max(minSize, maxSize * ratio);
    }

    preview.style.width = `${previewWidth}px`;
    preview.style.height = `${previewHeight}px`;

    const shape = shapeText.toLowerCase();

    if (shape.includes('circle')) {
        preview.classList.add('preview-circle');
        icon.innerText = '';
    } else if (shape.includes('square')) {
        preview.classList.add('preview-square');
        icon.innerText = '';
    } else {
        preview.classList.add('preview-contour');
        icon.innerText = '✂';
    }

    shapeLabel.innerText = shapeText;
    sizeLabel.innerText = `${width}" x ${height}"`;
}

function getSelectedSize() {
    const sizeBtn = document.querySelector('#size-options .item-active');

    if (sizeBtn.innerText.includes('Custom')) {
        return {
            width: parseFloat(document.getElementById('custom-w').value) || 1,
            height: parseFloat(document.getElementById('custom-h').value) || 1
        };
    }

    const match = sizeBtn.innerText.match(/(\d+(?:\.\d+)?)\s*"?\s*x\s*(\d+(?:\.\d+)?)\s*"?/i);

    if (match) {
        return {
            width: parseFloat(match[1]),
            height: parseFloat(match[2])
        };
    }

    return { width: 2, height: 2 };
}

