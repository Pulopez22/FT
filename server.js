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
        const options = lines.slice(1);
        return `
        <div style="border-bottom: 1px solid #eeeeee; padding: 15px 0;">
            <strong style="display: block; font-size: 16px; color: #000; text-transform: uppercase;">ITEM #${i + 1}: ${productName}</strong>
            <div style="margin-top: 5px;">
                ${options.map(opt => `<span style="display: block; font-size: 13px; color: #666666; margin-bottom: 2px;">• ${opt.trim()}</span>`).join('')}
            </div>
        </div>`;
    }).join('');

    const downloadSection = fileLinks.length > 0 
        ? `<div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 5px; border: 1px solid #ffeeba;">
            <h4 style="margin: 0 0 10px 0; color: #856404;">Archivos de Impresión:</h4>
            ${fileLinks.map((link, idx) => `<a href="${link}" target="_blank" style="display:block; color: #0056b3; font-size: 13px; margin-bottom: 8px; text-decoration: underline;">Descargar Archivo #${idx+1}</a>`).join('')}
           </div>`
        : '';

    return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="background: #000; color: #fff; padding: 10px; text-align: center;">Square Foot Printing</h2>
        <h1>New Order Received!</h1>
        <p><strong>Order ID:</strong> ${orderData.order_id}</p>
        <p><strong>Customer:</strong> ${orderData.customer_name} (${orderData.customer_email})</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
            ${itemsHtml}
            ${downloadSection}
            <h2 style="text-align: right;">TOTAL: ${orderData.total_price}</h2>
        </div>
    </body>
    </html>`;
};

// --- 5. CONFIGURACIÓN DE MULTER (CORREGIDO PARA RENDER) ---
// Usamos /tmp que es la carpeta temporal universal de Linux/Render
const upload = multer({ 
    dest: '/tmp/', 
    limits: { fileSize: 50 * 1024 * 1024 } 
});

// --- 6. RUTAS ---

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

// RUTA DE ORDEN (SIN DEPENDER DE CARPETAS LOCALES)
app.post('/api/place-order', upload.array('files'), async (req, res) => {
    try {
        console.log("🚀 Procesando nueva orden en Render...");
        const orderData = JSON.parse(req.body.data);
        const files = req.files || [];
        let fileLinks = [];

        // 1. Subir archivos a Cloudinary
        for (const file of files) {
            console.log(`Subiendo ${file.originalname} a Cloudinary...`);
            const result = await cloudinary.uploader.upload(file.path, {
                folder: 'sfp_orders',
                resource_type: 'auto'
            });
            fileLinks.push(result.secure_url);
            
            // Borrar el archivo de /tmp inmediatamente
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        }

        // 2. Enviar Correo
        await transporter.sendMail({
            from: '"Square Foot Printing" <onboarding@resend.dev>',
            to: `${orderData.customer_email}, za19012245@zapopan.tecmm.edu.mx`,
            subject: `Order Confirmation: ${orderData.order_id}`,
            html: emailTemplate(orderData, fileLinks),
        });

        res.status(200).send({ success: true, message: 'Order sent successfully!' });

    } catch (error) {
        console.error("❌ ERROR DETECTADO:", error.message);
        res.status(500).send({ success: false, error: error.message });
    }
});

// --- 7. INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});