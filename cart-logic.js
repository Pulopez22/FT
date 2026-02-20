/**
 * Square Foot Printing - Universal Cart Logic [FINAL]
 */
function addToCart() {
    // 1. Elementos básicos (IDs consistentes en todas las páginas)
    const productName = document.getElementById('prod-title')?.innerText || "Custom Product";
    // Limpiamos el precio de símbolos para asegurar que sea un número
    const productPrice = document.getElementById('final-price')?.innerText.replace(/[$,]/g, '') || "0.00";
    const mainImage = document.getElementById('preview-thumb')?.src || document.getElementById('main-prod-img')?.src;

    // 2. Objeto para las opciones técnicas
    const selections = {};

    // 3. Captura automática de medidas (Width/Height manual o Select)
    const w = document.getElementById('w-input')?.value;
    const h = document.getElementById('h-input')?.value;
    if (w && h) {
        selections["Size"] = `${w}" x ${h}"`;
    } else {
        const sizeSelect = document.getElementById('size-select');
        if (sizeSelect) selections["Size"] = sizeSelect.value;
    }

    // 4. Captura automática de todos los menús desplegables (select)
    const selectElements = document.querySelectorAll('select');
    selectElements.forEach(select => {
        // Evitamos duplicar el "Size" si ya lo capturamos arriba
        if (select.id !== 'size-select') { 
            const labelElement = select.parentElement.querySelector('label');
            const labelName = labelElement ? labelElement.innerText.trim() : select.id;
            selections[labelName] = select.options[select.selectedIndex].text;
        }
    });

    // 5. DETECCIÓN INTELIGENTE DE CANTIDAD (Qty)
    // Buscamos el input de cantidad. Si no existe, por defecto es 1.
    const qtyElement = document.getElementById('qty-input');
    const quantity = qtyElement ? parseInt(qtyElement.value) : 1;

    // 6. Crear el objeto final estructurado para el Checkout y Mailtrap
    const productEntry = {
        name: productName,
        price: parseFloat(productPrice),
        options: selections, // Detalles técnicos completos
        image: mainImage,
        quantity: quantity // Cantidad validada
    };

    // 7. Guardar en localStorage
    let cart = JSON.parse(localStorage.getItem('sqft_cart')) || [];
    cart.push(productEntry);
    localStorage.setItem('sqft_cart', JSON.stringify(cart));

    // 8. Feedback visual (Abre el sidebar si existe la función)
    if (typeof toggleCart === "function") {
        toggleCart();
    } else {
        alert(`${productName} added to cart!`);
    }
}