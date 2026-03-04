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

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- 1. CONEXIÓN A MONGODB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ Connection Error:', err));

// --- 2. MODELO DE USUARIO ---
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isWholesale: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// --- 3. TEMPLATE DE CORREO (Diseño UI) ---
const emailTemplate = (orderData) => {
    // Separamos los productos por el delimitador '---' que envíes desde el frontend
    const itemsArray = orderData.order_items.split('\n---\n').filter(item => item.trim() !== "");

    const itemsHtml = itemsArray.map((itemBlock, i) => {
        const lines = itemBlock.split('\n').filter(line => line.trim() !== "");
        const productName = lines[0] || "Product";
        const options = lines.slice(1);

        return `
        <div style="border-bottom: 1px solid #eeeeee; padding: 15px 0;">
            <strong style="display: block; font-size: 16px; color: #000; text-transform: uppercase;">ITEM #${i + 1}: ${productName}</strong>
            <div style="margin-top: 5px;">
                ${options.map(opt => `
                    <span style="display: block; font-size: 13px; color: #666666; margin-bottom: 2px;">
                        • ${opt.trim()}
                    </span>
                `).join('')}
            </div>
        </div>`;
    }).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica', Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center" style="padding: 20px 0;">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #dddddd; border-radius: 8px; overflow: hidden;">
                        <tr>
                            <td align="center" style="background-color: #000000; padding: 30px;">
                                <img src="cid:logo_sfp" alt="Square Foot Printing" width="200" style="display: block;">
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px;">
                                <h1 style="font-weight: 900; font-style: italic; text-transform: uppercase; color: #000000; font-size: 26px; margin: 0 0 20px 0;">New Order Received!</h1>
                                <p style="margin: 0; font-size: 14px; color: #333;"><strong>Order ID:</strong> ${orderData.order_id}</p>
                                <p style="margin: 5px 0 25px 0; font-size: 14px; color: #333;"><strong>Customer:</strong> ${orderData.customer_name} (${orderData.customer_email})</p>
                                
                                <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #eeeeee;">
                                    <h3 style="margin: 0 0 10px 0; border-bottom: 2px solid #000000; padding-bottom: 5px; text-transform: uppercase; font-size: 14px;">Order Summary</h3>
                                    ${itemsHtml}
                                    <div style="font-size: 28px; font-weight: 900; text-align: right; margin-top: 20px; font-style: italic;">
                                        TOTAL: ${orderData.total_price}
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="background-color: #f3f4f6; padding: 20px; font-size: 11px; color: #9ca3af;">
                                © 2026 Square Foot Printing - Las Vegas <br>
                                4425 W. Quail Ave. Suite 4, Las Vegas, NV 89118
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;
};

// --- 4. CONFIGURACIÓN DE MULTER ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ 
    storage,
    limits: { fieldSize: 100 * 1024 * 1024 } 
});

// --- 5. RUTAS ---

// Registro y Login (Tus rutas actuales se mantienen igual...)
app.post('/api/auth/register', async (req, res) => { /* Tu lógica de registro */ });
app.post('/api/auth/login', async (req, res) => { /* Tu lógica de login */ });

// RUTA DE ORDEN (CORREGIDA)
app.post('/api/place-order', upload.array('files'), async (req, res) => {
    try {
        const orderData = JSON.parse(req.body.data);
        const files = req.files || [];

        const transporter = nodemailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: { user: "09ee2ace2fcb4c", pass: "8a7eee9541e016" } // REEMPLAZAR EN PROD
        });

        // Configuración de Adjuntos (Logo + Archivos del cliente)
        const mailAttachments = [
            {
                filename: 'logo.png',
                path: path.join(__dirname, 'images/SquareFootPrinting-Logo-White-Text-Lrg-01-e1525129997491.jpg'),
                cid: 'logo_sfp'
            },
            ...files.map(file => ({
                filename: file.originalname,
                path: file.path
            }))
        ];

        await transporter.sendMail({
            from: '"Square Foot Printing" <ventas@sfpvegas.com>',
            to: `${orderData.customer_email}, za19012245@zapopan.tecmm.edu.mx`,
            subject: `Order Confirmation: ${orderData.order_id}`,
            html: emailTemplate(orderData),
            attachments: mailAttachments
        });

        // Borrar archivos temporales después de enviar
        files.forEach(file => { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); });

        res.status(200).send({ success: true, message: 'Order sent successfully!' });
    } catch (error) {
        console.error("Error sending order:", error);
        res.status(500).send({ success: false, error: error.message });
    }
});

// --- 6. INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});