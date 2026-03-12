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
            items: order.order_items,      // Enviamos todo el array con fotos y specs
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
    price: Number,      // Precio Wholesale
    type: { type: String, default: 'unit' } // 'unit', 'sqft', o 'size'
});

const Pricing = mongoose.model('Prices', pricingSchema);


app.post('/api/admin/seed-pricing-complete', async (req, res) => {
    try {
        await Pricing.deleteMany({});
        const data = [];

        // --- 1. CATEGORÍA: FLAGS ---
        data.push(
            { category: 'Flags', productId: 'custom-pole-flag', variantKey: 'base', price: 10.00, type: 'base' },
            { category: 'Flags', productId: 'custom-pole-flag', variantKey: 'double', price: 18.50, type: 'base' },
            { category: 'Flags', productId: 'teardrop-flag', variantKey: 'base', price: 19.17, type: 'base' },
            { category: 'Flags', productId: 'feather-angled-flag', variantKey: 'base', price: 19.17, type: 'base' },
            { category: 'Flags', productId: 'econo-feather-flag', variantKey: 'flag-only', price: 73.65, type: 'base' },
            { category: 'Flags', productId: 'econo-feather-flag', variantKey: 'full-kit', price: 156.60, type: 'base' },
            { category: 'Flags', productId: 'econo-feather-flag', variantKey: 'base', price: 33.32, type: 'base' }
        );

        // --- BANDERAS PRO (FEATHER Y TEARDROP) ---
        // Aquí incluimos TODAS las combinaciones que pasaste en tu objeto masterPricing
        const proIds = ['feather-angled-flag-pro', 'teardrop-flag-pro'];
        const proVariants = {
            "small-single-Printed Flag Only (No Hardware)-No": 63.42,
            "small-single-Printed Flag Only (No Hardware)-Yes": 98.36,
            "small-single-Printed Flag + Pole + Ground Stake-No": 112.19,
            "small-single-Printed Flag + Pole + Ground Stake-Yes": 133.97,
            "small-single-Printed Flag + Pole + Cross Base-No": 125.55,
            "small-single-Printed Flag + Pole + Cross Base-Yes": 146.82,
            "small-single-Printed Flag + Pole + Square Base-No": 138.29,
            "small-single-Printed Flag + Pole + Square Base-Yes": 159.29,
            "small-double-Printed Flag Only (No Hardware)-No": 112.92,
            "medium-single-Printed Flag Only (No Hardware)-No": 66.59,
            "large-single-Printed Flag Only (No Hardware)-No": 75.25,
            "xlarge-single-Printed Flag Only (No Hardware)-No": 154.26,
            "xlarge-double-Printed Flag Only (No Hardware)-Yes": 354.18
            // (Agrega aquí el resto de variantes PRO siguiendo este formato)
        };
        proIds.forEach(id => {
            for (let key in proVariants) {
                data.push({ category: 'Flags', productId: id, variantKey: key, price: proVariants[key], type: 'fixed' });
            }
        });

        // --- 2. CATEGORÍA: BANNERS (Precios x SQFT y Acabados) ---
        data.push(
            { category: 'Banners', productId: 'blockout-fabric', variantKey: 'material', price: 6.75, type: 'material' },
            { category: 'Banners', productId: 'blockout-fabric', variantKey: 'velcro-1', price: 1.50, type: 'option' },
            { category: 'Banners', productId: 'blockout-fabric', variantKey: 'velcro-2', price: 2.50, type: 'option' },
            { category: 'Banners', productId: 'wrinkle-free', variantKey: 'material', price: 3.00, type: 'material' },
            { category: 'Banners', productId: 'mesh-banner', variantKey: 'material', price: 2.00, type: 'material' },
            { category: 'Banners', productId: 'super-smooth', variantKey: 'material', price: 1.25, type: 'material' },
            { category: 'Banners', productId: 'standard-banner', variantKey: 'material', price: 0.00, type: 'material' }
        );

        // --- 3. CATEGORÍA: LARGE PRINTING ---
        data.push(
            { category: 'LargePrinting', productId: 'adhesive-vinyl', variantKey: 'material', price: 3.00, type: 'material' },
            { category: 'LargePrinting', productId: 'reflective-vinyl', variantKey: 'material', price: 6.00, type: 'material' },
            { category: 'LargePrinting', productId: 'window-perf', variantKey: 'material', price: 2.50, type: 'material' },
            { category: 'LargePrinting', productId: 'gallery-canvas', variantKey: '8x10', price: 29.34, type: 'size' },
            { category: 'LargePrinting', productId: 'gallery-canvas', variantKey: '24x36', price: 52.32, type: 'size' },
            { category: 'LargePrinting', productId: 'table-cover', variantKey: '6-3', price: 125.75, type: 'size' }
        );

        // --- 4. CATEGORÍA: RIGID SIGNS (Con Upcharges de Grosor) ---
        const rigidMats = { "pvc": 3.00, "foamboard": 3.50, "coroplast": 3.50, "styrene": 3.50 };
        for (let mat in rigidMats) {
            data.push({ category: 'RigidSigns', productId: mat, variantKey: 'material', price: rigidMats[mat], type: 'material' });
        }
        data.push(
            { category: 'RigidSigns', productId: 'acrylic', variantKey: 'material', price: 10.00, type: 'material' },
            { category: 'RigidSigns', productId: 'acrylic', variantKey: 'variant-clear', price: 4.00, type: 'option' },
            { category: 'RigidSigns', productId: 'acrylic', variantKey: 'thickness-1/8', price: 2.00, type: 'option' }
        );

        // --- 5. CATEGORÍA: DISPLAYS ---
        data.push(
            { category: 'Displays', productId: 'x-stand', variantKey: '24x63-13oz-Standard', price: 55.50, type: 'fixed' },
            { category: 'Displays', productId: 'retractable', variantKey: '33-Silver-Standard', price: 106.75, type: 'fixed' },
            { category: 'Displays', productId: 'eventtent', variantKey: 'full_kit-Standard', price: 492.90, type: 'fixed' }
        );

        // --- 6. CATEGORÍA: STICKERS (Temporal) ---
        data.push({ category: 'Stickers', productId: 'custom-sticker', variantKey: 'sq_inch', price: 0.05, type: 'material' });

        await Pricing.insertMany(data);
        res.json({ message: "¡Base de datos Maestra actualizada con ÉXITO!", totalRecords: data.length });
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server Square Foot Printing ready on port ${PORT}`));