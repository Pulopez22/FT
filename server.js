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

// --- 2. MODELOS (Añadimos el Modelo de Orden) ---
const User = mongoose.model('User', new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isWholesale: { type: Boolean, default: false }
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
    user: "09ee2ace2fcb4c", 
    pass: "8a7eee9541e016"  
  }
});

// --- TEMPLATE DE CORREO ---
const emailTemplate = (orderData) => {
    const itemsHtml = orderData.order_items.map((item, i) => `
        <div style="border-bottom: 1px solid #eee; padding: 15px 0;">
            <strong style="font-size: 16px; color: #000;">ITEM #${i + 1}: ${item.name}</strong><br>
            <p style="color: #666; font-size: 12px; white-space: pre-wrap; margin: 5px 0;">${item.details}</p>
            ${item.fileUrl ? `<a href="${item.fileUrl}" style="display: inline-block; background: #ef4444; color: #fff; padding: 10px 15px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 11px; margin-top: 10px;">DOWNLOAD PRINT FILE</a>` : '<span style="color: #999; font-size: 10px;">No file attached</span>'}
        </div>
    `).join('');

    return `<html><body style="font-family: Arial; padding: 20px;"><div style="max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;"><div style="background: #000; color: #fff; padding: 20px; text-align: center;"><h1 style="margin: 0;">SQUARE FOOT PRINTING</h1></div><div style="padding: 30px;"><h2>Order: ${orderData.order_id}</h2><p><strong>Customer:</strong> ${orderData.customer_name}</p>${itemsHtml}<h2 style="text-align: right;">TOTAL: ${orderData.total_price}</h2></div></div></body></html>`;
};

const upload = multer({ dest: '/tmp/' });

// --- RUTAS ---

// 1. Pre-carga a Cloudinary
app.post('/api/upload-preview', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: "No file received" });
        const result = await cloudinary.uploader.upload(req.file.path, { folder: 'sfp_orders', resource_type: 'auto' });
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(200).json({ success: true, url: result.secure_url });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Orden Final (Guardar en DB y enviar Mailtrap)
app.post('/api/place-order', async (req, res) => {
    try {
        const orderData = req.body;
        console.log(`📦 Procesando Orden ${orderData.order_id}...`);

        // A. Guardar en Base de Datos para el Panel de Admin
        const newOrder = new Order({
            order_id: orderData.order_id,
            customer_name: orderData.customer_name,
            customer_email: orderData.customer_email,
            total_price: orderData.total_price,
            items: orderData.order_items
        });
        await newOrder.save();

        // B. Responder al cliente de inmediato
        res.status(200).json({ success: true, message: "Order stored" });

        // C. Enviar correo en segundo plano
        transporter.sendMail({
            from: '"SFP Orders" <ventas@sfp-lasvegas.com>',
            to: `za19012245@zapopan.tecmm.edu.mx`, 
            subject: `New Order: ${orderData.order_id}`,
            html: emailTemplate(orderData),
        }).catch(err => console.error("❌ Error Mailtrap:", err.message));

    } catch (error) {
        console.error("❌ Error Crítico:", error.message);
        if (!res.headersSent) res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Ruta para el Panel de Admin (Obtener todas las órdenes)
app.get('/api/admin/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rutas de Auth
app.post('/api/auth/register', async (req, res) => { /* ... */ });
app.post('/api/auth/login', async (req, res) => { /* ... */ });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server ready on port ${PORT}`));