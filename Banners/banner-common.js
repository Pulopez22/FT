const BANNER_MIN_INPUT = 0.01;
const BANNER_MAX_INPUT = 40000;

function getBannerSizeInputs() {
    return {
        widthInput: document.getElementById('width-input'),
        heightInput: document.getElementById('height-input')
    };
}

function updateWhileTyping() {
    const { widthInput, heightInput } = getBannerSizeInputs();

    if (!widthInput || !heightInput) {
        return;
    }

    if (
        widthInput.value.trim() === '' ||
        heightInput.value.trim() === ''
    ) {
        return;
    }

    updateOrderedLabels();

    if (typeof calculatePrice === 'function') {
        calculatePrice();
    }
}

function validateSize() {
    const { widthInput, heightInput } = getBannerSizeInputs();

    if (!widthInput || !heightInput) {
        return;
    }

    let width = parseFloat(widthInput.value);
    let height = parseFloat(heightInput.value);

    if (!Number.isFinite(width)) {
        width = BANNER_MIN_INPUT;
    }

    if (!Number.isFinite(height)) {
        height = BANNER_MIN_INPUT;
    }

    width = Math.max(
        BANNER_MIN_INPUT,
        Math.min(BANNER_MAX_INPUT, width)
    );

    height = Math.max(
        BANNER_MIN_INPUT,
        Math.min(BANNER_MAX_INPUT, height)
    );

    widthInput.value = width.toFixed(2);
    heightInput.value = height.toFixed(2);

    updateOrderedLabels();

    if (typeof calculatePrice === 'function') {
        calculatePrice();
    }
}

function updateOrderedLabels() {
    const { widthInput, heightInput } = getBannerSizeInputs();

    if (!widthInput || !heightInput) {
        return;
    }

    const width = parseFloat(widthInput.value) || 0;
    const height = parseFloat(heightInput.value) || 0;

    const widthLabel =
        document.getElementById('ordered-w-label');

    const heightLabel =
        document.getElementById('ordered-h-label');

    if (widthLabel) {
        widthLabel.innerText = width;
    }

    if (heightLabel) {
        heightLabel.innerText = height;
    }

    const areaBox =
        document.getElementById('printing-area');

    if (!areaBox || width <= 0 || height <= 0) {
        return;
    }

    const maxPreview = 300;
    const minPreview = 20;

    if (width >= height) {
        areaBox.style.width = `${maxPreview}px`;

        areaBox.style.height = `${Math.max(
            minPreview,
            maxPreview * (height / width)
        )}px`;
    } else {
        areaBox.style.height = `${maxPreview}px`;

        areaBox.style.width = `${Math.max(
            minPreview,
            maxPreview * (width / height)
        )}px`;
    }
}