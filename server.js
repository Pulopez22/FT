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
// --- TEMPLATE DE CORREO CORREGIDO ---
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
                
                ${item.fileUrl ? `
                    <div style="margin-top: 15px;">
                        <a href="${item.fileUrl}" style="display: inline-block; background: #000; color: #fff; padding: 10px 18px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 11px; letter-spacing: 0.5px;">
                            DOWNLOAD PRINT FILE
                        </a>
                    </div>` : ''}
            </div>
        `;
    }).join('');

    return `
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #ffffff; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: auto;">
            
            <div style="background: #000; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <img src="cid:logo_sfp" 
                     alt="SQUARE FOOT PRINTING" 
                     style="width: 300px; height: auto; display: block; margin: 0 auto;">
            </div>

            <div style="padding: 30px 10px;">
                <h1 style="font-style: italic; font-weight: 900; font-size: 32px; margin: 0 0 20px 0; color: #000; letter-spacing: -1px;">
                    NEW ORDER RECEIVED!
                </h1>
                
                <div style="font-size: 15px; color: #333; margin-bottom: 30px; line-height: 1.6;">
                    <strong>Order ID:</strong> ${orderData.order_id}<br>
                    <strong>Customer:</strong> ${orderData.customer_name} (${orderData.customer_phone})
                </div>

                <div style="border: 1px solid #eee; border-radius: 12px; padding: 25px; background-color: #fafafa;">
                    <h2 style="font-size: 16px; margin: 0 0 20px 0; border-bottom: 2px solid #000; padding-bottom: 8px; width: 100%; letter-spacing: 1px;">
                        ORDER SUMMARY
                    </h2>
                    
                    ${itemsHtml}
                </div>
                
                <div style="text-align: right; margin-top: 20px; padding-right: 10px;">
                    <h2 style="font-size: 22px; color: #000; margin: 0;">TOTAL: $${orderData.total_price}</h2>
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

        // A. Guardar en Base de Datos
        const newOrder = new Order({
            order_id: orderData.order_id,
            customer_name: orderData.customer_name,
            customer_email: orderData.customer_email,
            total_price: orderData.total_price,
            items: orderData.order_items
        });
        await newOrder.save();

        res.status(200).json({ success: true, message: "Order stored" });

        // B. Enviar correo con ADJUNTO CID
        transporter.sendMail({
            from: '"SFP Orders" <ventas@sfp-lasvegas.com>',
            to: `za19012245@zapopan.tecmm.edu.mx`, 
            subject: `New Order: ${orderData.order_id}`,
            html: emailTemplate(orderData),
            attachments: [
                {
                    filename: 'logo.jpg',
                    // Asegúrate de que esta ruta sea correcta en tu servidor
                    path: 'images/SquareFootPrinting-Logo-White-Text-Lrg-01-e1525129997491.jpg', 
                    cid: 'logo_sfp' // Este ID debe coincidir con el src="cid:logo_sfp"
                }
            ]
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
// --- RUTAS DE AUTENTICACIÓN ---

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, inviteCode } = req.body;

        // 1. Verificar si el usuario ya existe
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: "El email ya está registrado" });
        }

        // 2. Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Determinar si es Wholesale (basado en el código que vimos en tu captura: sight2026)
const isWholesale = (inviteCode && inviteCode.trim().toLowerCase() === 'sight2026');

        // 4. Crear el nuevo usuario
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            isWholesale
        });

        await newUser.save();

        // 5. Enviar respuesta de éxito
        res.status(201).json({
            success: true,
            message: "Usuario creado con éxito",
            isWholesale: newUser.isWholesale
        });

    } catch (error) {
        console.error("❌ Error en Registro:", error.message);
        res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ success: false, message: "Usuario no encontrado" });

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ success: false, message: "Contraseña incorrecta" });

        res.json({
            success: true,
            name: user.name,
            email: user.email,
            isWholesale: user.isWholesale
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server ready on port ${PORT}`));