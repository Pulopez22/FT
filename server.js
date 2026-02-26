const express = require('express');
const multer = require('multer');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

/**
 * 1. HTML EMAIL TEMPLATE
 * Se añadió la lógica de .split(',') para que cada característica sea una línea.
 */
const emailTemplate = (orderData) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        .container { max-width: 600px; margin: 20px auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background-color: #ffffff; }
        .header { background-color: #000; padding: 30px; text-align: center; }
        .content { padding: 40px; color: #333; line-height: 1.6; }
        .heavy-italic { font-weight: 900; font-style: italic; text-transform: uppercase; color: #000; font-size: 28px; margin: 0; }
        .details-box { background-color: #f9fafb; padding: 25px; border-radius: 12px; margin-top: 25px; border: 1px solid #dee2e6; }
        .item { border-bottom: 1px solid #eee; padding: 20px 0; }
        .item:last-child { border-bottom: none; }
        .product-line { display: block; margin-bottom: 4px; font-size: 14px; color: #4b5563; }
        .file-label { font-size: 11px; color: #ef4444; font-weight: bold; text-transform: uppercase; margin-top: 10px; display: block; background: #fee2e2; padding: 4px 8px; border-radius: 4px; width: fit-content; }
        .footer { background-color: #f3f4f6; padding: 25px; text-align: center; font-size: 10px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="cid:logo_sfp" alt="Square Foot Printing" width="180">
        </div>
        <div class="content">
            <h1 class="heavy-italic">New Order Received!</h1>
            <p style="margin-bottom: 5px;"><strong>Order ID:</strong> ${orderData.order_id}</p>
            <p style="margin-top: 0;"><strong>Customer:</strong> ${orderData.customer_name} (${orderData.customer_email})</p>
            
            <div class="details-box">
                <h3 style="margin-top:0; border-bottom: 2px solid #000; padding-bottom: 10px; text-transform: uppercase; font-size: 16px;">Order Summary</h3>
                <div style="margin-top: 10px;">
                    ${orderData.order_items.split('\n').filter(line => line.trim() !== '').map((item, index) => {
                        
                        // Extraemos partes para el nombre del archivo
                        const productNameRaw = item.split('.')[1]?.split('[')[0]?.trim() || 'design';
                        const productNameFormated = productNameRaw.replace(/\s+/g, '-').toLowerCase();
                        const expectedFileName = `${productNameFormated}-${orderData.order_id}-${index + 1}.png`;

                        // DIVIDIMOS EL PRODUCTO POR COMAS PARA HACER LAS LÍNEAS
                        const lines = item.split(',');

                        return `
                            <div class="item">
                                <strong style="color: #000; font-size: 15px; display: block; margin-bottom: 8px;">ITEM #${index + 1}</strong>
                                ${lines.map(line => `<span class="product-line">• ${line.trim()}</span>`).join('')}
                                <span class="file-label">📎 ATTACHED: ${expectedFileName}</span>
                            </div>`;
                    }).join('')}
                </div>
                <div style="font-size: 24px; font-weight: 900; text-align: right; margin-top: 25px; font-style: italic; color: #000;">
                    TOTAL: ${orderData.total_price}
                </div>
            </div>
        </div>
        <div class="footer" style="text-transform: uppercase; letter-spacing: 2px;">
            © 2026 Square Foot Printing - Las Vegas facility
        </div>
    </div>
</body>
</html>
`;

/**
 * 2. STORAGE CONFIGURATION
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

/**
 * 3. MAIN ORDER ROUTE
 */
app.post('/api/place-order', upload.array('files'), async (req, res) => {
    try {
        const orderData = JSON.parse(req.body.data);
        const files = req.files || [];

        // Configuración de Mailtrap para pruebas (Cámbialo a tu servicio real en producción)
        const transporter = nodemailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: "09ee2ace2fcb4c",
                pass: "8a7eee9541e016"
            }
        });

        // Preparar adjuntos: Logo + Archivos subidos
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
            subject: `Order Confirmation: ${orderData.order_id}`,
            html: emailTemplate(orderData),
            attachments: mailAttachments
        };

        await transporter.sendMail(mailOptions);

        // Limpiar archivos locales después de enviar el correo
        files.forEach(file => {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });

        res.status(200).send({ success: true, message: 'Order processed and email sent' });

    } catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).send({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`-----------------------------------------`);
    console.log(`SFP Server running on: http://localhost:${PORT}`);
    console.log(`-----------------------------------------`);
});