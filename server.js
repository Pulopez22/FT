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

// Middleware
app.use(cors());
app.use(express.json());

// 1. CONEXIÓN A MONGODB ATLAS
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error de conexión:', err));

// 2. MODELO DE USUARIO
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// 3. RUTAS DE AUTENTICACIÓN (LOGIN/REGISTRO)

// Registro de usuario
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Verificar si ya existe
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'El usuario ya existe' });

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ success: true, message: 'Usuario creado correctamente' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Login de usuario
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Credenciales inválidas' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Credenciales inválidas' });

        // Crear Token JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            user: { name: user.name, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. LÓGICA DE ÓRDENES Y CORREO (TU CÓDIGO ACTUAL MEJORADO)

const emailTemplate = (orderData) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: sans-serif; }
        .container { max-width: 600px; margin: 20px auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background-color: #ffffff; }
        .header { background-color: #000; padding: 30px; text-align: center; }
        .content { padding: 40px; color: #333; line-height: 1.6; }
        .heavy-italic { font-weight: 900; font-style: italic; text-transform: uppercase; color: #000; font-size: 28px; margin: 0; }
        .details-box { background-color: #f9fafb; padding: 25px; border-radius: 12px; margin-top: 25px; border: 1px solid #dee2e6; }
        .item { border-bottom: 1px solid #eee; padding: 20px 0; }
        .product-line { display: block; margin-bottom: 4px; font-size: 14px; color: #4b5563; }
        .footer { background-color: #f3f4f6; padding: 25px; text-align: center; font-size: 10px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><img src="cid:logo_sfp" alt="Logo" width="180"></div>
        <div class="content">
            <h1 class="heavy-italic">New Order Received!</h1>
            <p><strong>Order ID:</strong> ${orderData.order_id}</p>
            <p><strong>Customer:</strong> ${orderData.customer_name} (${orderData.customer_email})</p>
            <div class="details-box">
                <h3 style="border-bottom: 2px solid #000; padding-bottom: 10px;">Order Summary</h3>
                ${orderData.order_items.split('\n').filter(l => l.trim()).map((item, i) => `
                    <div class="item">
                        <strong>ITEM #${i + 1}</strong>
                        ${item.split(',').map(line => `<span class="product-line">• ${line.trim()}</span>`).join('')}
                    </div>
                `).join('')}
                <div style="font-size: 24px; font-weight: 900; text-align: right; margin-top: 25px;">TOTAL: ${orderData.total_price}</div>
            </div>
        </div>
        <div class="footer">© 2026 Square Foot Printing - Las Vegas</div>
    </div>
</body>
</html>
`;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => { cb(null, Date.now() + '-' + file.originalname); }
});
const upload = multer({ storage });

app.post('/api/place-order', upload.array('files'), async (req, res) => {
    try {
        const orderData = JSON.parse(req.body.data);
        const files = req.files || [];

        const transporter = nodemailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: { user: "09ee2ace2fcb4c", pass: "8a7eee9541e016" }
        });

        const mailAttachments = [
            {
                filename: 'logo.jpg',
                path: path.join(__dirname, 'images/SquareFootPrinting-Logo-White-Text-Lrg-01-e1525129997491.jpg'),
                cid: 'logo_sfp'
            },
            ...files.map(file => ({
                filename: file.originalname,
                path: file.path
            }))
        ];

        await transporter.sendMail({
            from: '"Square Foot Printing" <pulopez20@gmail.com>',
            to: `${orderData.customer_email}, za19012245@zapopan.tecmm.edu.mx`,
            subject: `Order Confirmation: ${orderData.order_id}`,
            html: emailTemplate(orderData),
            attachments: mailAttachments
        });

        files.forEach(file => { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); });

        res.status(200).send({ success: true, message: 'Order processed' });
    } catch (error) {
        res.status(500).send({ success: false, error: error.message });
    }
});

// 5. INICIO DEL SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server ready on port ${PORT}`);
});