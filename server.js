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

// --- 4. TEMPLATE DE CORREO ---
const emailTemplate = (orderData, fileLinks) => {
    const itemsRaw = orderData.order_items || "";
    const itemsArray = itemsRaw.split('\n---\n').filter(item => item.trim() !== "");

    const itemsHtml = itemsArray.map((itemBlock, i) => {
        const lines = itemBlock.split('\n').filter(line => line.trim() !== "");
        const productName = lines[0] || "Product";
        const details = lines.slice(1);
        return `
        <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
            <strong>ITEM #${i + 1}: ${productName}</strong><br>
            ${details.map(d => `<small style="color: #666;">• ${d}</small><br>`).join('')}
        </div>`;
    }).join('');

    const downloadSection = fileLinks.length > 0 
        ? `<div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 5px;">
            <h4 style="margin: 0;">Archivos de Impresión:</h4>
            ${fileLinks.map((link, idx) => `<a href="${link}" target="_blank" style="display:block; font-size: 12px; margin-top:5px;">Descargar Archivo #${idx+1}</a>`).join('')}
           </div>`
        : '';

    return `
    <html>
    <body style="font-family: Arial; padding: 20px;">
        <h2 style="background: #000; color: #fff; padding: 10px; text-align: center;">Square Foot Printing</h2>
        <h3>New Order: ${orderData.order_id}</h3>
        <p><strong>Customer:</strong> ${orderData.customer_name} (${orderData.customer_email})</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
            ${itemsHtml}
            ${downloadSection}
            <h2 style="text-align: right;">TOTAL: ${orderData.total_price}</h2>
        </div>
    </body>
    </html>`;
};

// --- 5. CONFIGURACIÓN DE MULTER (PARA RENDER) ---
const upload = multer({ dest: '/tmp/' });

// --- 6. RUTAS ---
app.post('/api/auth/register', async (req, res) => { /* Tu lógica de registro */ });
app.post('/api/auth/login', async (req, res) => { /* Tu lógica de login */ });

// RUTA DE ORDEN CORREGIDA
app.post('/api/place-order', upload.array('files'), async (req, res) => {
    try {
        console.log("🚀 Procesando orden...");
        
        // Protección contra JSON malformado o ausente
        if (!req.body.data) throw new Error("No order data provided");
        const orderData = JSON.parse(req.body.data);
        
        const files = req.files || [];
        let fileLinks = [];

        // Subir a Cloudinary (solo si hay archivos)
        for (const file of files) {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: 'sfp_orders',
                resource_type: 'auto'
            });
            fileLinks.push(result.secure_url);
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        }

        // Enviar Correo
        await transporter.sendMail({
            from: '"Square Foot Printing" <onboarding@resend.dev>',
            to: `${orderData.customer_email}, za19012245@zapopan.tecmm.edu.mx`,
            subject: `Order Confirmation: ${orderData.order_id}`,
            html: emailTemplate(orderData, fileLinks),
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("❌ ERROR:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server ready on port ${PORT}`));