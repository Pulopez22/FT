require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

const app = express();

// --- 0. CONFIGURACIÓN DE CLOUDINARY ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

app.use(cors());
app.use(express.json());

// --- 1. CONEXIÓN A MONGODB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ Connection Error:', err));

// --- 2. MODELOS ---
const User = mongoose.model('User', new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isWholesale: { type: Boolean, default: false }
}));

// --- 3. TRANSPORTER DE CORREO (RESEND) ---
const transporter = nodemailer.createTransport({
    host: 'smtp.resend.com',
    secure: true,
    port: 465,
    auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY, 
    },
});

// --- 4. TEMPLATE DE CORREO MEJORADO ---
const emailTemplate = (orderData) => {
    const itemsHtml = orderData.order_items.map((item, i) => `
        <div style="border-bottom: 1px solid #eee; padding: 15px 0;">
            <strong style="font-size: 16px; color: #000;">ITEM #${i + 1}: ${item.name}</strong><br>
            <p style="color: #666; font-size: 12px; white-space: pre-wrap; margin: 5px 0;">${item.details}</p>
            ${item.fileUrl ? `
                <a href="${item.fileUrl}" 
                   style="display: inline-block; background: #ef4444; color: #fff; padding: 10px 15px; 
                   text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 11px; margin-top: 10px;">
                   DOWNLOAD PRINT FILE
                </a>` : '<span style="color: #999; font-size: 10px;">No file attached</span>'}
        </div>
    `).join('');

    return `
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 10px; overflow: hidden; border: 1px solid #ddd;">
                <div style="background: #000; color: #fff; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; letter-spacing: 2px;">SQUARE FOOT PRINTING</h1>
                </div>
                <div style="padding: 30px;">
                    <h2 style="margin-top: 0; color: #000;">New Order: ${orderData.order_id}</h2>
                    <p><strong>Customer:</strong> ${orderData.customer_name}</p>
                    <p><strong>Email:</strong> ${orderData.customer_email}</p>
                    <hr style="border: 0; border-top: 1px solid #eee;">
                    ${itemsHtml}
                    <div style="margin-top: 30px; text-align: right;">
                        <h2 style="color: #000; margin: 0;">TOTAL: ${orderData.total_price}</h2>
                    </div>
                </div>
                <div style="background: #eee; padding: 15px; text-align: center; font-size: 10px; color: #888;">
                    © 2026 Square Foot Printing - Las Vegas, NV
                </div>
            </div>
        </body>
    </html>`;
};

// --- 5. CONFIGURACIÓN DE MULTER ---
const upload = multer({ dest: '/tmp/' });

// --- 6. RUTAS ---

// RUTA A: Pre-carga de archivos (Se usa en la página de producto)
app.post('/api/upload-preview', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: "No file received" });

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'sfp_orders',
            resource_type: 'auto'
        });

        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        res.status(200).json({ success: true, url: result.secure_url });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// RUTA B: Procesar Orden Final (Se usa en checkout.html)
app.post('/api/place-order', async (req, res) => {
    try {
        const orderData = req.body; // Recibe el JSON del nuevo checkout
        
        console.log(`📦 Procesando Orden ${orderData.order_id}...`);

        await transporter.sendMail({
            from: '"Square Foot Printing" <onboarding@resend.dev>',
            to: `${orderData.customer_email}, za19012245@zapopan.tecmm.edu.mx`,
            subject: `Order Confirmation: ${orderData.order_id}`,
            html: emailTemplate(orderData),
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("❌ ERROR:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rutas de Auth (Mantén tus lógicas aquí)
app.post('/api/auth/register', async (req, res) => { /* ... */ });
app.post('/api/auth/login', async (req, res) => { /* ... */ });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server ready on port ${PORT}`));