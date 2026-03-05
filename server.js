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

// --- CONFIGURACIÓN ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ Connection Error:', err));

const transporter = nodemailer.createTransport({
    host: 'smtp.resend.com',
    secure: true,
    port: 465,
    auth: { user: 'resend', pass: process.env.RESEND_API_KEY },
});

// --- TEMPLATE DE CORREO ---
const emailTemplate = (orderData) => {
    const itemsHtml = orderData.order_items.map((item, i) => `
        <div style="border-bottom: 1px solid #eee; padding: 15px 0;">
            <strong style="font-size: 16px; color: #000;">ITEM #${i + 1}: ${item.name}</strong><br>
            <p style="color: #666; font-size: 12px; white-space: pre-wrap; margin: 5px 0;">${item.details}</p>
            ${item.fileUrl ? `
                <a href="${item.fileUrl}" 
                   style="display: inline-block; background: #ef4444; color: #fff; padding: 10px 15px; 
                   text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 11px; margin-top: 10px;">
                   DESCARGAR ARCHIVO DE IMPRESIÓN
                </a>` : '<span style="color: #999; font-size: 10px;">Sin archivo adjunto</span>'}
        </div>
    `).join('');

    return `
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 10px; border: 1px solid #ddd; overflow: hidden;">
                <div style="background: #000; color: #fff; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; color: #fff;">SQUARE FOOT PRINTING</h1>
                </div>
                <div style="padding: 30px;">
                    <h2 style="color: #000;">Orden: ${orderData.order_id}</h2>
                    <p><strong>Cliente:</strong> ${orderData.customer_name} (${orderData.customer_email})</p>
                    <hr style="border: 0; border-top: 1px solid #eee;">
                    ${itemsHtml}
                    <h2 style="text-align: right; margin-top: 20px; color: #000;">TOTAL: ${orderData.total_price}</h2>
                </div>
            </div>
        </body>
    </html>`;
};

const upload = multer({ dest: '/tmp/' });

// --- RUTAS ---

// 1. Pre-carga (Sube el archivo a Cloudinary y devuelve URL)
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

// 2. Orden Final (Recibe JSON y envía correo en segundo plano)
app.post('/api/place-order', async (req, res) => {
    try {
        const orderData = req.body;
        console.log(`📦 Procesando Orden ${orderData.order_id}...`);

        // RESPUESTA INMEDIATA para evitar timeout
        res.status(200).json({ success: true, message: "Order processed" });

        // ENVÍO DE CORREO ASÍNCRONO
        transporter.sendMail({
            from: '"Square Foot Printing" <onboarding@resend.dev>',
            to: `za19012245@zapopan.tecmm.edu.mx`, // Cambiar por tu correo verificado si es necesario
            subject: `Order Confirmation: ${orderData.order_id}`,
            html: emailTemplate(orderData),
        }).then(() => console.log("✅ Email sent")).catch(err => console.error("❌ Email error:", err.message));

    } catch (error) {
        console.error("❌ Error Crítico:", error.message);
        if (!res.headersSent) res.status(500).json({ success: false, error: error.message });
    }
});

// Rutas de Auth
app.post('/api/auth/register', async (req, res) => { /* Tu lógica de registro */ });
app.post('/api/auth/login', async (req, res) => { /* Tu lógica de login */ });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server ready on port ${PORT}`));