require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const paypal = require('@paypal/checkout-server-sdk');

// Configuración de PayPal
let environment = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID, 
    process.env.PAYPAL_SECRET
);
let paypalClient = new paypal.core.PayPalHttpClient(environment);

const app = express();

// --- CONFIGURACIÓN CLOUDINARY ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

app.use(cors());
app.use(express.json());

// --- CONEXIÓN MONGODB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ Connection Error:', err));

// --- MODELOS ---
const User = mongoose.model('User', new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isWholesale: { type: Boolean, default: false },
    role: { type: String, default: 'customer' } // 'admin' o 'customer'
}));

const Order = mongoose.model('Order', new mongoose.Schema({
    order_id: String,
    customer_name: String,
    customer_email: String,
    customer_phone: String,
    total_price: String,
    order_items: Array, 
    status: { type: String, default: 'Pending' },
    payment_status: { type: String, default: 'Pending' }, // "Paid" o "Pending"
    transaction_id: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
}));

// --- CONFIGURACIÓN DE CORREO (MAILTRAP) ---
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER || "09ee2ace2fcb4c", 
    pass: process.env.MAILTRAP_PASS || "8a7eee9541e016"  
  }
});

// --- MIDDLEWARE DE AUTENTICACIÓN ---
const authMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretSFP');
        req.user = decoded;
        next();
    } catch (e) {
        res.status(400).json({ msg: 'Token is not valid' });
    }
};

// --- TEMPLATE DE CORREO CON LOGO ---
const emailTemplate = (orderData) => {
    const itemsHtml = orderData.order_items.map((item, i) => {
        // Convertimos el string de detalles en una lista con puntos
        const detailsArray = item.details ? item.details.split(/[|\n]/) : [];
        const detailsHtml = detailsArray
            .map(detail => detail.trim())
            .filter(detail => detail.length > 0)
            .map(detail => `<li style="margin-bottom: 2px;">• ${detail.toUpperCase()}</li>`)
            .join('');

        return `
            <div style="margin-bottom: 30px; font-family: Arial, sans-serif; border-bottom: 1px solid #eee; padding-bottom: 15px;">
                <strong style="font-size: 16px; color: #000; display: block; margin-bottom: 5px;">
                    ITEM #${i + 1}: ${item.name.toUpperCase()}
                </strong>
                <ul style="list-style: none; padding: 0; margin: 0; color: #666; font-size: 13px; line-height: 1.5;">
                    ${detailsHtml}
                    <li style="margin-bottom: 2px; font-weight: bold; color: #000;">• PRICE: $${item.price}</li>
                </ul>
                ${item.fileUrl ? `
                    <div style="margin-top: 15px;">
                        <a href="${item.fileUrl}" style="display: inline-block; background: #000; color: #fff; padding: 10px 18px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 11px;">
                            DOWNLOAD PRINT FILE
                        </a>
                    </div>` : ''}
            </div>`;
    }).join('');

    return `
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #ffffff; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
            <div style="background: #000; padding: 30px; text-align: center;">
                <img src="cid:logo_sfp" alt="SQUARE FOOT PRINTING" style="width: 250px; height: auto;">
            </div>
            <div style="padding: 30px;">
                <h1 style="font-size: 24px; margin-bottom: 20px; color: #000;">New Order Received!</h1>
                <p style="font-size: 14px;"><strong>Order ID:</strong> ${orderData.order_id}</p>
                <p style="font-size: 14px;"><strong>Customer:</strong> ${orderData.customer_name}</p>
                <p style="font-size: 14px;"><strong>Phone:</strong> ${orderData.customer_phone}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <h2 style="font-size: 16px; letter-spacing: 1px; text-transform: uppercase;">Order Summary</h2>
                ${itemsHtml}
                <div style="text-align: right; margin-top: 20px;">
                    <h2 style="font-size: 22px; color: #000;">TOTAL: $${orderData.total_price}</h2>
                </div>
            </div>
        </div>
    </body>
    </html>`;
};

const upload = multer({ dest: '/tmp/' });

// --- RUTAS ---

// 1. Registro
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, inviteCode } = req.body;
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ success: false, message: "Email already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const isWholesale = (inviteCode && inviteCode.trim().toLowerCase() === 'sight2026');

        user = new User({ name, email: email.toLowerCase(), password: hashedPassword, isWholesale });
        await user.save();
        res.status(201).json({ success: true, message: "User registered" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) return res.status(400).json({ success: false, message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secretSFP', { expiresIn: '8h' });

        res.json({
            success: true,
            token,
            user: { name: user.name, email: user.email, isWholesale: user.isWholesale, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. Crear Orden (Sincronizado con checkout.html y MongoDB)
app.post('/api/place-order', async (req, res) => {
    try {
        const orderData = req.body;
        const newOrder = new Order({
            order_id: orderData.order_id,
            customer_name: orderData.customer_name,
            customer_email: orderData.customer_email,
            customer_phone: orderData.customer_phone,
            total_price: orderData.total_price,
            order_items: orderData.order_items,
            payment_status: orderData.payment_status || 'Pending',
            transaction_id: orderData.transaction_id || ''
        });
        await newOrder.save();

        // Enviar Correo con Logo adjunto
        transporter.sendMail({
            from: '"SFP Orders" <ventas@sfp-lasvegas.com>',
            to: `za19012245@zapopan.tecmm.edu.mx`, 
            subject: `New Order: ${orderData.order_id}`,
            html: emailTemplate(orderData),
            attachments: [
                {
                    filename: 'logo.jpg',
                    path: './images/SquareFootPrinting-Logo-White-Text-Lrg-01-e1525129997491.jpg', 
                    cid: 'logo_sfp' 
                }
            ]
        }).catch(err => console.log("❌ Email Error:", err.message));

        res.status(200).json({ success: true, id: newOrder._id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. ADMIN: Obtener todas las órdenes
app.get('/api/admin/orders', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: "Forbidden" });
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. ADMIN: Actualizar estado de orden
app.patch('/api/admin/orders/:id/status', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: "No autorizado" });
        const { status } = req.body;
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. Carga de Archivos de Arte a Cloudinary
app.post('/api/upload-preview', upload.single('file'), async (req, res) => {
    try {
        const result = await cloudinary.uploader.upload(req.file.path, { 
            folder: 'sfp_orders',
            resource_type: 'auto' 
        });
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.json({ success: true, url: result.secure_url });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/checkout/create-paypal-order', async (req, res) => {
    try {
        const { items } = req.body;
        
        // 1. Protección: Verificar que items exista y sea un arreglo válido
        if (!items || !Array.isArray(items)) {
            throw new Error("El carrito está vacío o corrupto.");
        }

        // 2. Cálculo seguro usando los datos que sí vienen del frontend
        let finalAmount = 0;
        items.forEach(item => {
            // Aseguramos que el item existe y tiene la propiedad price
            if (item && item.price) {
                let p = typeof item.price === 'string' ? parseFloat(item.price.replace(/[$,]/g, '')) : item.price;
                if (!isNaN(p)) {
                    // Si tienes reglas como el mínimo de $50, se aplican aquí también
                    finalAmount += (p < 50 && !item.isMinimumApplied) ? 50 : p;
                }
            }
        });

        // 3. Protección vital: PayPal explota si le mandas $0.00
        if (finalAmount <= 0) {
            throw new Error("El monto total a cobrar no puede ser 0.");
        }

        // 4. Crear la orden de PayPal
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: finalAmount.toFixed(2) // Formato estricto para PayPal (ej. "150.00")
                }
            }]
        });

        const order = await paypalClient.execute(request);
        res.json({ id: order.result.id });
    } catch (err) {
        console.error("Error PayPal:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Ruta para capturar el pago (Confirmar que el dinero se movió)
app.post('/api/checkout/capture-paypal-order', async (req, res) => {
    const { orderID, orderDatabaseId } = req.body; // Recibimos el ID de PayPal y el ID de nuestra DB

    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    try {
        const capture = await paypalClient.execute(request);
        
        // 1. Verificar si el pago fue exitoso según PayPal
        if (capture.result.status === 'COMPLETED') {
            const transactionId = capture.result.purchase_units[0].payments.captures[0].id;

            // 2. Actualizar la orden en MongoDB
            await Order.findByIdAndUpdate(orderDatabaseId, {
                payment_status: 'Paid',
                transaction_id: transactionId,
                status: 'Processing' // Ya puedes empezar a imprimir
            });

            res.json({ success: true, details: capture.result });
        } else {
            res.status(400).json({ success: false, message: 'Pago no completado' });
        }
    } catch (err) {
        console.error("Error capturando pago:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- BUSCA ESTA RUTA AL FINAL DE TU ARCHIVO Y REEMPLÁZALA ---
app.get('/api/orders/track/:orderId', async (req, res) => {
    try {
        const order = await Order.findOne({ order_id: req.params.orderId });
        
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // CAMBIO AQUÍ: Enviamos 'order_items' completo, no solo el .length
        res.json({
            success: true,
            status: order.status,
            customer_name: order.customer_name,
            total_price: order.total_price, // Agregado para mostrar en el resumen
            items: order.order_items,      // Enviamos todo el array con fotos y specs
            createdAt: order.createdAt
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const pricingSchema = new mongoose.Schema({
    category: String,
    productId: String,
    variantKey: String, // Para llaves complejas como "small-single-Printed..."
    price: Number,      // Precio Wholesale
    type: { type: String, default: 'unit' } // 'unit', 'sqft', o 'size'
});

const Pricing = mongoose.model('Prices', pricingSchema);

async function calculateTotalFromDB(items, isWholesaleUser) {
    let totalWholesale = 0;
    for (const item of items) {
        const priceRecord = await Pricing.findOne({ 
            productId: item.productId, 
            variantKey: item.variantKey || 'base' 
        });

        if (priceRecord) {
            let itemPrice = priceRecord.price;
            if (priceRecord.type === 'sqft') {
                const width = Math.max(1, Math.abs(parseFloat(item.width) || 1));
                const height = Math.max(1, Math.abs(parseFloat(item.height) || 1));

                const sqft = width * height;

                let unitPrice = itemPrice * sqft;
                // Sumar opciones si existen (ej. velcro)
                if (item.options && Array.isArray(item.options)) {
                    for (const optKey of item.options) {
                        const optRecord = await Pricing.findOne({ productId: item.productId, variantKey: optKey });
                        if (optRecord) unitPrice += (optRecord.price * (priceRecord.type === 'sqft' ? sqft : 1));
                    }
                }
                totalWholesale += unitPrice * (item.quantity || 1);
            } else {
                totalWholesale += itemPrice * (item.quantity || 1);
            }
        }
    }
    const multiplier = isWholesaleUser ? 1 : 2;
    return (totalWholesale * multiplier).toFixed(2);
}

app.get('/api/admin/seed-pricing-complete', async (req, res) => {
    try {
        await Pricing.deleteMany({});
       const data = [];

        // --- 1. CATEGORÍA: FLAGS (Básicas y PRO completas) ---
        data.push(
            { category: 'Flags', productId: 'custom-pole-flag', variantKey: 'base', price: 10.00, type: 'base' },
            { category: 'Flags', productId: 'custom-pole-flag', variantKey: 'double', price: 18.50, type: 'base' },
            { category: 'Flags', productId: 'teardrop-flag', variantKey: 'base', price: 63.42, type: 'base' },
            { category: 'Flags', productId: 'feather-angled-flag', variantKey: 'base', price: 63.42, type: 'base' },
            { category: 'Flags', productId: 'econo-feather-flag', variantKey: 'flag-only', price: 73.65, type: 'base' },
            { category: 'Flags', productId: 'econo-feather-flag', variantKey: 'full-kit', price: 156.60, type: 'base' },
        );

        // BANDERAS PRO (Feather y Teardrop comparten la misma matriz de precios según tu masterPricing)
        const proProducts = ['feather-angled-flag-pro', 'teardrop-flag-pro'];
        const proMatrix = {
            "small-single-Printed Flag Only (No Hardware)-No": 63.42, "small-single-Printed Flag Only (No Hardware)-Yes": 98.36,
            "small-single-Printed Flag + Pole + Ground Stake-No": 112.19, "small-single-Printed Flag + Pole + Ground Stake-Yes": 133.97,
            "small-single-Printed Flag + Pole + Cross Base-No": 125.55, "small-single-Printed Flag + Pole + Cross Base-Yes": 146.82,
            "small-single-Printed Flag + Pole + Cross Base + Water Bag-No": 134.46, "small-single-Printed Flag + Pole + Cross Base + Water Bag-Yes": 155.99,
            "small-single-Printed Flag + Pole + Square Base-No": 138.29, "small-single-Printed Flag + Pole + Square Base-Yes": 159.29,
            "small-single-Printed Flag + Pole + Ground Stake + Cross Base-No": 141.35, "small-single-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 163.13,
            "small-double-Printed Flag Only (No Hardware)-No": 112.92, "small-double-Printed Flag Only (No Hardware)-Yes": 147.86,
            "small-double-Printed Flag + Pole + Ground Stake-No": 161.69, "small-double-Printed Flag + Pole + Ground Stake-Yes": 183.47,
            "small-double-Printed Flag + Pole + Cross Base-No": 175.05, "small-double-Printed Flag + Pole + Cross Base-Yes": 196.32,
            "small-double-Printed Flag + Pole + Cross Base + Water Bag-No": 183.96, "small-double-Printed Flag + Pole + Cross Base + Water Bag-Yes": 205.49,
            "small-double-Printed Flag + Pole + Square Base-No": 187.79, "small-double-Printed Flag + Pole + Square Base-Yes": 208.79,
            "small-double-Printed Flag + Pole + Ground Stake + Cross Base-No": 190.85, "small-double-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 212.63,
            "medium-single-Printed Flag Only (No Hardware)-No": 66.59, "medium-single-Printed Flag Only (No Hardware)-Yes": 103.27,
            "medium-single-Printed Flag + Pole + Ground Stake-No": 117.79, "medium-single-Printed Flag + Pole + Ground Stake-Yes": 140.66,
            "medium-single-Printed Flag + Pole + Cross Base-No": 131.83, "medium-single-Printed Flag + Pole + Cross Base-Yes": 154.16,
            "medium-single-Printed Flag + Pole + Cross Base + Water Bag-No": 141.18, "medium-single-Printed Flag + Pole + Cross Base + Water Bag-Yes": 163.78,
            "medium-single-Printed Flag + Pole + Square Base-No": 145.20, "medium-single-Printed Flag + Pole + Square Base-Yes": 167.25,
            "medium-single-Printed Flag + Pole + Ground Stake + Cross Base-No": 148.41, "medium-single-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 171.28,
            "medium-double-Printed Flag Only (No Hardware)-No": 118.57, "medium-double-Printed Flag Only (No Hardware)-Yes": 155.25,
            "medium-double-Printed Flag + Pole + Ground Stake-No": 169.77, "medium-double-Printed Flag + Pole + Ground Stake-Yes": 192.64,
            "medium-double-Printed Flag + Pole + Cross Base-No": 183.80, "medium-double-Printed Flag + Pole + Cross Base-Yes": 206.14,
            "medium-double-Printed Flag + Pole + Cross Base + Water Bag-No": 193.16, "medium-double-Printed Flag + Pole + Cross Base + Water Bag-Yes": 215.76,
            "medium-double-Printed Flag + Pole + Square Base-No": 197.17, "medium-double-Printed Flag + Pole + Square Base-Yes": 219.22,
            "medium-double-Printed Flag + Pole + Ground Stake + Cross Base-No": 200.39, "medium-double-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 223.26,
            "large-single-Printed Flag Only (No Hardware)-No": 75.25, "large-single-Printed Flag Only (No Hardware)-Yes": 115.60,
            "large-single-Printed Flag + Pole + Ground Stake-No": 131.57, "large-single-Printed Flag + Pole + Ground Stake-Yes": 156.73,
            "large-single-Printed Flag + Pole + Cross Base-No": 147.01, "large-single-Printed Flag + Pole + Cross Base-Yes": 171.58,
            "large-single-Printed Flag + Pole + Cross Base + Water Bag-No": 157.30, "large-single-Printed Flag + Pole + Cross Base + Water Bag-Yes": 182.16,
            "large-single-Printed Flag + Pole + Square Base-No": 161.72, "large-single-Printed Flag + Pole + Square Base-Yes": 185.97,
            "large-single-Printed Flag + Pole + Ground Stake + Cross Base-No": 165.25, "large-single-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 190.41   ,
            "large-double-Printed Flag Only (No Hardware)-No": 132.42, "large-double-Printed Flag Only (No Hardware)-Yes": 172.77,
            "large-double-Printed Flag + Pole + Ground Stake-No": 188.75, "large-double-Printed Flag + Pole + Ground Stake-Yes": 213.90,
            "large-double-Printed Flag + Pole + Cross Base-No": 204.18, "large-double-Printed Flag + Pole + Cross Base-Yes": 228.75,
            "large-double-Printed Flag + Pole + Cross Base + Water Bag-No": 214.47, "large-double-Printed Flag + Pole + Cross Base + Water Bag-Yes": 239.34,
            "large-double-Printed Flag + Pole + Square Base-No": 218.89, "large-double-Printed Flag + Pole + Square Base-Yes": 243.15,
            "large-double-Printed Flag + Pole + Ground Stake + Cross Base-No": 190.85, "large-double-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 247.58,
            "xlarge-single-Printed Flag Only (No Hardware)-No": 154.26, "xlarge-single-Printed Flag Only (No Hardware)-Yes": 236.98,
            "xlarge-single-Printed Flag + Pole + Ground Stake-No": 269.73, "xlarge-single-Printed Flag + Pole + Ground Stake-Yes": 390.34,
            "xlarge-single-Printed Flag + Pole + Cross Base-No": 301.37, "xlarge-single-Printed Flag + Pole + Cross Base-Yes": 351.73,
            "xlarge-single-Printed Flag + Pole + Cross Base + Water Bag-No": 322.47, "xlarge-single-Printed Flag + Pole + Cross Base + Water Bag-Yes": 373.43,
            "xlarge-single-Printed Flag + Pole + Square Base-No": 331.52, "xlarge-single-Printed Flag + Pole + Square Base-Yes": 381.25,
            "xlarge-single-Printed Flag + Pole + Ground Stake + Cross Base-No": 338.77, "xlarge-single-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 390.34,
            "xlarge-double-Printed Flag Only (No Hardware)-No": 271.47, "xlarge-double-Printed Flag Only (No Hardware)-Yes": 354.18,
            "xlarge-double-Printed Flag + Pole + Ground Stake-No": 386.93, "xlarge-double-Printed Flag + Pole + Ground Stake-Yes": 438.50,
            "xlarge-double-Printed Flag + Pole + Cross Base-No": 418.57, "xlarge-double-Printed Flag + Pole + Cross Base-Yes": 468.94,
            "xlarge-double-Printed Flag + Pole + Cross Base + Water Bag-No": 439.67, "xlarge-double-Printed Flag + Pole + Cross Base + Water Bag-Yes": 490.64,
            "xlarge-double-Printed Flag + Pole + Square Base-No": 448.73, "xlarge-double-Printed Flag + Pole + Square Base-Yes": 498.45,
            "xlarge-double-Printed Flag + Pole + Ground Stake + Cross Base-No": 455.97, "xlarge-double-Printed Flag + Pole + Ground Stake + Cross Base-Yes": 507.54,
 };
        proProducts.forEach(pId => {
            for (let variant in proMatrix) {
                data.push({ category: 'Flags', productId: pId, variantKey: variant, price: proMatrix[variant], type: 'fixed' });
            }
        });

        // --- 2. CATEGORÍA: BANNERS (Precios sqft y complementos) ---
        const bannerMaterials = {
            "blockout-fabric": 6.75, "wrinkle-free": 3.00, "hd-banner-18oz": 3.00,
            "mesh-banner": 2.00, "super-smooth": 1.25, "standard-banner": 0, "tension-fabric": 6.00
        };
        for (let mat in bannerMaterials) {
            data.push({ category: 'Banners', productId: mat, variantKey: 'material', price: bannerMaterials[mat], type: 'sqft' });
        }
        // Upcharges específicos de Banners
        data.push(
            { category: 'Banners', productId: 'blockout-fabric', variantKey: 'velcro-1', price: 1.50, type: 'option' },
            { category: 'Banners', productId: 'blockout-fabric', variantKey: 'velcro-2', price: 2.50, type: 'option' },
            { category: 'Banners', productId: 'wrinkle-free', variantKey: 'hem-3.50', price: 0.50, type: 'option' },
            { category: 'Banners', productId: 'wrinkle-free', variantKey: 'pocket-1.00', price: 1.00, type: 'option' },
            { category: 'Banners', productId: 'wrinkle-free', variantKey: 'velcro-1.50', price: 1.50, type: 'option' },
            { category: 'Banners', productId: 'wrinkle-free', variantKey: 'velcro-3.00', price: 3.00, type: 'option' }
        );

        // --- 3. CATEGORÍA: LARGE PRINTING ---
        const lpMats = {
            "calendar-vinyl": 1.25, "bubble-free": 2.00, "rough-wall": 2.50, "phototex": 2.50,
            "glass-adhere": 2.50, "magnet": 5.50, "adhesive-vinyl": 3.00, "floor-graphics": 4.00,
            "reflective-vinyl": 6.00, "tshirt-vinyl": 25.00, "heat-press-vinyl": 25.00, "backlit-film": 3.50,
            "window-perf": 2.50
        };
        for (let mat in lpMats) {
            data.push({ category: 'LargePrinting', productId: mat, variantKey: 'material', price: lpMats[mat], type: 'sqft' });
        }
        // Tallas fijas Gallery Canvas
        const canvasSizes = { "8x10": 29.34, "11x14": 31.56, "12x12": 31.43, "12x16": 33.05, "12x18": 33.69, "16x16": 34.82, "16x20": 36.17, "16x24": 39.27, "24x24": 42.38, "24x36": 52.32, "32x48": 81.59 };
        for (let size in canvasSizes) {
            data.push({ category: 'LargePrinting', productId: 'gallery-canvas', variantKey: size, price: canvasSizes[size], type: 'fixed' });
        }
        // Tallas fijas Table Cover
        const tableSizes = { "4-3": 105.75, "6-3": 125.75, "8-3": 146.66, "4-4": 141.75, "6-4": 161.75, "8-4": 191.75 };
        for (let size in tableSizes) {
            data.push({ category: 'LargePrinting', productId: 'table-cover', variantKey: size, price: tableSizes[size], type: 'fixed' });
        }

        // --- 4. CATEGORÍA: RIGID SIGNS ---
        const rigidMats = { "PVC": 3.00, "Foamboard": 3.50, "Coroplast": 3.50, "Styrene": 3.50, "Ultraboard": 5.00, "Aluminum Signs": 4.50 };
        for (let mat in rigidMats) {
            data.push({ category: 'RigidSigns', productId: mat.toLowerCase().replace(/\s/g, ''), variantKey: 'material', price: rigidMats[mat], type: 'sqft' });
        }
        // Casos especiales: Acrylic y Lexan
        data.push(
            { category: 'RigidSigns', productId: 'acrylic', variantKey: 'material', price: 10.00, type: 'sqft' },
            { category: 'RigidSigns', productId: 'acrylic', variantKey: 'clear', price: 4.00, type: 'option' },
            { category: 'RigidSigns', productId: 'acrylic', variantKey: 'blackout', price: 4.00, type: 'option' },
            { category: 'RigidSigns', productId: 'acrylic', variantKey: 'backlit_white', price: 8.00, type: 'option' },
            { category: 'RigidSigns', productId: 'acrylic', variantKey: '1/8', price: 2.00, type: 'option' },
            { category: 'RigidSigns', productId: 'acrylic', variantKey: '3/16', price: 5.00, type: 'option' }
        );

        // --- 5. CATEGORÍA: DISPLAYS (Matriz completa) ---
        // X-Stand
        data.push(
            { category: 'Displays', productId: 'x-stand', variantKey: '24x63-13oz-Standard', price: 55.50 },
            { category: 'Displays', productId: 'x-stand', variantKey: '24x63-13oz-Next Day', price: 88.50 },
            { category: 'Displays', productId: 'x-stand', variantKey: '32x71-popup-Standard', price: 94.50 }
        );
        // Retractable (Muestra de los principales)
        const retractables = ["24-Silver-Standard (2 Days)-160.75", "33-Silver-Standard (2 Days)-106.75", "33-Black-Standard (2 Days)-113.75", "60-Silver-Next Day-454.50"];
        retractables.forEach(r => {
            const [size, color, turn, price] = r.split('-');
            data.push({ category: 'Displays', productId: 'retractable', variantKey: `${size}-${color}-${turn}`, price: parseFloat(price), type: 'fixed' });
        });
        // Event Tent
        data.push(
            { category: 'Displays', productId: 'eventtent', variantKey: 'full_kit-Standard', price: 492.90 },
            { category: 'Displays', productId: 'eventtent', variantKey: 'canopy_only-Standard', price: 295.00 }
        );

        // --- 6. CATEGORÍA: STICKERS (Temporal) ---
        data.push({ category: 'Stickers', productId: 'custom-sticker', variantKey: 'sq_inch', price: 0.05, type: 'sqft' });
        await Pricing.insertMany(data);
        res.json({ message: "¡Base de datos Maestra actualizada con ÉXITO!", totalRecords: data.length });
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server Square Foot Printing ready on port ${PORT}`));