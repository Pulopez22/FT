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
    const itemsHtml = orderData.order_items.map((item, i) => {
        // Formatear detalles si vienen como string con saltos de línea
        const detailsArray = item.details ? item.details.split('\n') : [];
        const detailsHtml = detailsArray
            .map(detail => `<li style="margin-bottom: 2px;">• ${detail.toUpperCase()}</li>`)
            .join('');

        return `
            <div style="margin-bottom: 25px; font-family: Arial, sans-serif;">
                <strong style="font-size: 16px; color: #000; display: block; margin-bottom: 5px;">
                    ITEM #${i + 1}: ${item.name.toUpperCase()}
                </strong>
                <ul style="list-style: none; padding: 0; margin: 0; color: #666; font-size: 13px; line-height: 1.4;">
                    ${detailsHtml}
                    <li style="margin-bottom: 2px;">• PRICE: $${item.price}</li>
                </ul>
                ${item.fileUrl ? `
                    <a href="${item.fileUrl}" style="display: inline-block; background: #000; color: #fff; padding: 8px 12px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 10px; margin-top: 10px;">
                        DOWNLOAD PRINT FILE
                    </a>` : ''}
            </div>
        `;
    }).join('');

    return `
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #fff; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: auto;">
            
            <div style="background: #000; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <img src="images/square-foot-printing-logo.png" alt="SQUARE FOOT PRINTING" style="width: 280px; filter: brightness(0) invert(1);">
            </div>

            <div style="padding: 30px 10px;">
                <h1 style="font-style: italic; font-weight: 900; font-size: 28px; margin: 0 0 20px 0; color: #000;">
                    NEW ORDER RECEIVED!
                </h1>
                
                <p style="margin: 0 0 5px 0; font-size: 15px; color: #333;">
                    <strong>Order ID:</strong> ${orderData.order_id}
                </p>
                <p style="margin: 0 0 30px 0; font-size: 15px; color: #333;">
                    <strong>Customer:</strong> ${orderData.customer_name} (${orderData.customer_phone})
                </p>

                <div style="border: 1px solid #e0e0e0; border-radius: 12px; padding: 20px; background-color: #fcfcfc;">
                    <h2 style="font-size: 16px; margin: 0 0 15px 0; border-bottom: 2px solid #000; display: inline-block; padding-bottom: 5px; width: 100%;">
                        ORDER SUMMARY
                    </h2>
                    
                    ${itemsHtml}
                </div>
            </div>
        </div>
    </body>
    </html>`;
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