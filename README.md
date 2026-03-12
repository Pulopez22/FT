# FT
Square Foot Printin


function addToCart() {
    // 1. OBTENER DATOS BÁSICOS (IDs estandarizados en tus HTML)
    const prodTitle = document.getElementById('prod-title')?.innerText || "Custom Product";
    const finalPriceText = document.getElementById('final-price')?.innerText || "$0.00";
    const qty = parseInt(document.getElementById('qty-input')?.value) || 1;
    const mainImg = document.getElementById('main-prod-img')?.src || "";

    // 2. RECOPILAR OPCIONES DE LOS SELECTS
    // Buscamos todos los select de la página
    const optionElements = document.querySelectorAll('select.custom-dropdown');
    let itemDetails = [];
    let variantKey = "base"; // Por defecto

    optionElements.forEach(select => {
        const label = select.previousElementSibling?.innerText || "Option";
        const text = select.options[select.selectedIndex].text;
        const value = select.value;

        // Si es el select de hardware o material, esa es nuestra variantKey para la DB
        if (select.id.includes('hardware') || select.id.includes('material')) {
            variantKey = value;
        }
        
        itemDetails.push(`${label}: ${text}`);
    });

    // 3. CAPTURAR MEDIDAS (Solo para Banners y Rigid Signs)
    // Si existen los inputs de width/height los guardamos
    const widthInput = document.getElementById('width-input');
    const heightInput = document.getElementById('height-input');
    
    // 4. CAPTURAR VALIDACIÓN DE ARTE (Tu lógica de PDF/Imagen)
    let artNote = "";
    if (typeof uploadedFileUrl !== 'undefined' && uploadedFileUrl !== "") {
        const previewThumb = document.getElementById('preview-thumb');
        const pdfCanvas = document.getElementById('pdf-canvas');
        const el = (pdfCanvas && !pdfCanvas.classList.contains('hidden')) ? pdfCanvas : previewThumb;
        
        const hasAutoFit = (el && el.style.objectFit === "cover") ? "YES" : "NO";
        const isRotated = (el && el.style.transform.includes("rotate")) ? "YES" : "NO";
        artNote = ` | AUTOFIT: ${hasAutoFit} | ROTATED: ${isRotated}`;
    }

    // 5. CREAR EL OBJETO PARA EL SERVIDOR
    const item = {
        name: prodTitle,
        productId: PRODUCT_ID, // Definido al inicio del script de cada página
        variantKey: variantKey,
        price: parseFloat(finalPriceText.replace(/[$,]/g, '')),
        image: mainImg,
        fileUrl: typeof uploadedFileUrl !== 'undefined' ? uploadedFileUrl : "",
        details: itemDetails.join(' | ') + artNote,
        quantity: qty,
        // Dimensiones para que el servidor calcule el precio real por sqft
        width: widthInput ? parseFloat(widthInput.value) : 0,
        height: heightInput ? parseFloat(heightInput.value) : 0
    };

    // 6. GUARDAR EN LOCALSTORAGE
    let cart = JSON.parse(localStorage.getItem('sqft_cart')) || [];
    cart.push(item);
    localStorage.setItem('sqft_cart', JSON.stringify(cart));
    
    // 7. UI: AVISAR AL USUARIO Y REFRESCAR EL CARRITO LATERAL
    if (typeof resetUpload === 'function') resetUpload();
    if (typeof toggleCart === 'function') toggleCart();
}