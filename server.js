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

// --- 3. TRANSPORTER DE CORREO (RESEND SMTP) ---
const transporter = nodemailer.createTransport({
    host: 'smtp.resend.com',
    secure: true,
    port: 465,
    auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY, // Tu API Key de Resend re_...
    },
});

// --- 4. TEMPLATE DE CORREO (Diseño UI) ---
const emailTemplate = (orderData, fileLinks) => {
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

    // Generar HTML de links de descarga si existen
    const downloadSection = fileLinks.length > 0 
        ? `<div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 5px;">
            <h4 style="margin: 0 0 10px 0;">Archivos de Impresión:</h4>
            ${fileLinks.map((link, idx) => `<a href="${link}" style="display:block; color: #856404; font-size: 12px; margin-bottom: 5px;">Descargar Archivo #${idx+1}</a>`).join('')}
           </div>`
        : '';

    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center" style="padding: 20px 0;">
                    <table width="600" style="background-color: #ffffff; border: 1px solid #dddddd; border-radius: 8px;">
                        <tr>
                            <td align="center" style="background-color: #000000; padding: 30px;">
                                <img src="cid:logo_sfp" alt="Square Foot Printing" width="200">
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px;">
                                <h1 style="font-style: italic; color: #000000; font-size: 26px;">New Order Received!</h1>
                                <p><strong>Order ID:</strong> ${orderData.order_id}</p>
                                <p><strong>Customer:</strong> ${orderData.customer_name} (${orderData.customer_email})</p>
                                
                                <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px;">
                                    <h3 style="border-bottom: 2px solid #000; padding-bottom: 5px;">Order Summary</h3>
                                    ${itemsHtml}
                                    ${downloadSection}
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

// --- 5. CONFIGURACIÓN DE MULTER ---
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
    limits: { fileSize: 50 * 1024 * 1024 } // Límite de 50MB por archivo
});

// --- 6. RUTAS ---

// Registro
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, isWholesale } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword, isWholesale });
        await newUser.save();
        res.status(201).json({ message: "User registered" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.json({ token, user: { name: user.name, email: user.email, isWholesale: user.isWholesale } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// RUTA DE ORDEN (CON CLOUDINARY)
app.post('/api/place-order', upload.array('files'), async (req, res) => {
    try {
        const orderData = JSON.parse(req.body.data);
        const files = req.files || [];
        let fileLinks = [];

        // 1. Subir archivos a Cloudinary
        for (const file of files) {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: 'sfp_orders',
                resource_type: 'auto'
            });
            fileLinks.push(result.secure_url);
            // Borrar archivo local inmediatamente después de subirlo a la nube
            fs.unlinkSync(file.path);
        }

        // 2. Enviar Correo
        await transporter.sendMail({
            // Asegúrate de que ventas@sfpvegas.com esté verificado en Resend
            from: '"Square Foot Printing" <onboarding@resend.dev>',
            to: `${orderData.customer_email}, za19012245@zapopan.tecmm.edu.mx`,
            subject: `Order Confirmation: ${orderData.order_id}`,
            html: emailTemplate(orderData, fileLinks),
            attachments: [{
                filename: 'logo.png',
                path: path.join(__dirname, 'images/SquareFootPrinting-Logo-White-Text-Lrg-01-e1525129997491.jpg'),
                cid: 'logo_sfp'
            }]
        });

        res.status(200).send({ success: true, message: 'Order sent successfully!' });
    } catch (error) {
        console.error("Error sending order:", error);
        res.status(500).send({ success: false, error: error.message });
    }
});

// --- 7. INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});