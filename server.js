require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// 1. TEMPLATE DEL EMAIL
const emailTemplate = (orderData) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Inter', sans-serif; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #eee; }
        .header { background-color: #000; padding: 30px; text-align: center; }
        .content { padding: 40px; color: #333; }
        .heavy-italic { font-weight: 900; font-style: italic; text-transform: uppercase; color: #000; font-size: 24px; }
        .details-box { background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .footer { padding: 20px; text-align: center; font-size: 10px; color: #9ca3af; text-transform: uppercase; }
        .item { border-bottom: 1px solid #eee; padding: 10px 0; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="cid:logo_sfp" alt="Square Foot Printing" width="180">
        </div>
        <div class="content">
            <h1 class="heavy-italic">Order Confirmation</h1>
            <p>Hello <strong>${orderData.customer_name}</strong>,</p>
            <p>Order ID: <span style="color: #ef4444; font-weight: bold;">${orderData.order_id}</span></p>
            
            <div class="details-box">
                <h3>Order Summary</h3>
                <p><strong>Method:</strong> ${orderData.delivery_method.toUpperCase()}</p>
                <div style="margin: 15px 0;">
                    ${orderData.order_items.split('\n').map(item => `<div class="item">${item}</div>`).join('')}
                </div>
                <h2 style="text-align: right;">Total: ${orderData.total_price}</h2>
            </div>
        </div>
        <div class="footer">© 2026 Square Foot Printing - Las Vegas</div>
    </div>
</body>
</html>
`;

// 2. CONFIGURACIÓN DE ALMACENAMIENTO
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
const upload = multer({ storage: storage });

// 3. RUTA DE PEDIDOS
app.post('/api/place-order', upload.array('files'), async (req, res) => {
    try {
        const orderData = JSON.parse(req.body.data);
        const files = req.files || [];

        // CONFIGURACIÓN MAILTRAP (Asegúrate de usar tus credenciales)
        const transporter = nodemailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: "09ee2ace2fcb4c",
                pass: "8a7eee9541e016"
            }
        });

        // Preparar adjuntos: Logo + Diseños del cliente
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

        const mailOptions = {
            from: '"Square Foot Printing" <pulopez20@gmail.com>',
            to: `${orderData.customer_email}, za19012245@zapopan.tecmm.edu.mx`,
            subject: `Order Received: ${orderData.order_id}`,
            html: emailTemplate(orderData),
            attachments: mailAttachments
        };

        await transporter.sendMail(mailOptions);

        // Limpiar archivos subidos para no llenar el servidor
        files.forEach(file => fs.unlinkSync(file.path));

        res.status(200).send({ message: 'Order processed successfully' });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).send('Error processing order');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));