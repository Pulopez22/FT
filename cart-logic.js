/**
 * Square Foot Printing - Universal Cart Logic
 * Este archivo debe ser llamado en todas las pestañas de producto.
 */

function addToCart() {
    // 1. Capturar elementos básicos de la página
    const productName = document.querySelector('h1')?.innerText || "Custom Product";
    const productPrice = document.getElementById('total-price')?.innerText || "$0.00";
    const mainImage = document.getElementById('main-img')?.src || "";

    // 2. Objeto para almacenar las opciones personalizadas
    const selections = {};

    // 3. Buscamos todos los menús desplegables (select) en la página
    const selectElements = document.querySelectorAll('select');

    selectElements.forEach(select => {
        // Intentamos obtener el nombre de la opción desde el label o el atributo name
        // Esto permite que si el producto tiene "Hem" o "Size", se guarde correctamente
        const label = select.getAttribute('name') || 
                      select.previousElementSibling?.innerText || 
                      "Option";
        
        // Guardamos la opción seleccionada por el usuario
        selections[label] = select.value;
    });

    // 4. Crear el objeto final del producto
    const productEntry = {
        name: productName,
        price: productPrice,
        options: selections, // Aquí viajan los detalles específicos (Grommets, Velcro, etc.)
        image: mainImage
    };

    // 5. Guardar en el carrito (localStorage)
    let cart = JSON.parse(localStorage.getItem('sqft_cart')) || [];
    cart.push(productEntry);
    localStorage.setItem('sqft_cart', JSON.stringify(cart));

    // 6. Feedback visual para el cliente
    alert(`Added to cart: ${productName}\nDetails: ${Object.keys(selections).length} options saved.`);
    
    // Opcional: Redirigir al checkout después de agregar
    // window.location.href = '../checkout.html';
}