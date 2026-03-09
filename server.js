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
    total_price: String,
    items: Array,
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

// --- TEMPLATE DE CORREO ---
const emailTemplate = (orderData) => {
    const itemsHtml = orderData.order_items.map((item, i) => {
        const detailsArray = item.details ? item.details.split('\n') : [];
        const detailsHtml = detailsArray
            .map(detail => `<li style="margin-bottom: 2px;">• ${detail.toUpperCase()}</li>`)
            .join('');

        return `
            <div style="margin-bottom: 30px; font-family: Arial, sans-serif;">
                <strong style="font-size: 16px; color: #000; display: block; margin-bottom: 5px;">
                    ITEM #${i + 1}: ${item.name.toUpperCase()}
                </strong>
                <ul style="list-style: none; padding: 0; margin: 0; color: #666; font-size: 13px; line-height: 1.5;">
                    ${detailsHtml}
                    <li style="margin-bottom: 2px;">• PRICE: $${item.price}</li>
                </ul>
                ${item.fileUrl ? `<div style="margin-top: 15px;"><a href="${item.fileUrl}" style="background: #000; color: #fff; padding: 10px 18px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 11px;">DOWNLOAD PRINT FILE</a></div>` : ''}
            </div>
        `;
    }).join('');

    return `<html><body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: auto; border: 1px solid #eee;">
            <div style="background: #000; padding: 20px; text-align: center;">
                <h2 style="color: white; margin: 0;">SQUARE FOOT PRINTING</h2>
            </div>
            <div style="padding: 20px;">
                <h1>Order ${orderData.order_id}</h1>
                <p>Customer: ${orderData.customer_name}</p>
                <hr>
                ${itemsHtml}
                <h3>TOTAL: $${orderData.total_price}</h3>
            </div>
        </div>
    </body></html>`;
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

// 3. Crear Orden
app.post('/api/place-order', async (req, res) => {
    try {
        const orderData = req.body;
        const newOrder = new Order({
            order_id: orderData.order_id,
            customer_name: orderData.customer_name,
            customer_email: orderData.customer_email,
            total_price: orderData.total_price,
            items: orderData.order_items
        });
        await newOrder.save();

        // Enviar Correo
        transporter.sendMail({
            from: '"SFP Orders" <ventas@sfp-lasvegas.com>',
            to: `za19012245@zapopan.tecmm.edu.mx`, 
            subject: `New Order: ${orderData.order_id}`,
            html: emailTemplate(orderData)
        }).catch(err => console.log("Mail Error:", err.message));

        res.status(200).json({ success: true, id: newOrder._id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. Obtener Órdenes (Solo Admin)
app.get('/api/admin/orders', authMiddleware, async (req, res) => {
    try {
        // Solo si el usuario es admin en la DB
        if (req.user.role !== 'admin') return res.status(403).json({ msg: "Forbidden" });
        
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/admin/orders/:id/status', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: "No autorizado" });
        
        const { status } = req.body;
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id, 
            { status: status }, 
            { new: true }
        );
        
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. Carga de Archivos
app.post('/api/upload-preview', upload.single('file'), async (req, res) => {
    try {
        const result = await cloudinary.uploader.upload(req.file.path, { folder: 'sfp_orders' });
        fs.unlinkSync(req.file.path);
        res.json({ success: true, url: result.secure_url });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server ready on port ${PORT}`));