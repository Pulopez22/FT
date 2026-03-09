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
    const itemsHtml = orderData.order_items.map((item, i) => `
        <div style="margin-bottom: 20px; font-family: Arial, sans-serif; border-bottom: 1px solid #eee; padding-bottom: 10px;">
            <strong style="font-size: 14px; color: #000;">ITEM #${i + 1}: ${item.name.toUpperCase()}</strong>
            <p style="font-size: 12px; color: #666; margin: 5px 0;">Specs: ${item.details || 'Standard'}</p>
            <p style="font-size: 12px; font-weight: bold;">Price: $${item.price}</p>
            ${item.fileUrl ? `<div style="margin-top: 10px;"><a href="${item.fileUrl}" style="background: #000; color: #fff; padding: 8px 12px; text-decoration: none; border-radius: 4px; font-size: 10px; font-weight: bold;">DOWNLOAD ART FILE</a></div>` : ''}
        </div>
    `).join('');

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
            order_items: orderData.order_items
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server Square Foot Printing ready on port ${PORT}`));