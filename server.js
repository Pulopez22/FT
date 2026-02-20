const express = require('express');
const multer = require('multer');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

/**
 * 1. HTML EMAIL TEMPLATE
 * Designed to match the Square Foot Printing aesthetic.
 * Content translated to English for the Las Vegas market.
 */
const emailTemplate = (orderData) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { font-family: 'Inter', sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background-color: #ffffff; }
        .header { background-color: #000; padding: 30px; text-align: center; }
        .content { padding: 40px; color: #333; line-height: 1.6; }
        .heavy-italic { font-weight: 900; font-style: italic; text-transform: uppercase; color: #000; font-size: 28px; margin: 0; }
        .order-id { color: #ef4444; font-weight: bold; }
        .details-box { background-color: #f9fafb; padding: 25px; border-radius: 12px; margin-top: 25px; border: 1px solid #f3f4f6; }
        .footer { background-color: #f3f4f6; padding: 25px; text-align: center; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 2px; }
        .item { border-bottom: 1px solid #eee; padding: 12px 0; font-size: 14px; }
        .item:last-child { border-bottom: none; }
        .total { font-size: 22px; font-weight: 900; text-align: right; margin-top: 25px; color: #000; font-style: italic; }
        .badge { background-color: #000; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="images/SquareFootPrinting-Logo-White-Text-Lrg-01-e1525129997491.jpg   " alt="Square Foot Printing" width="180">
        </div>
        <div class="content">
            <h1 class="heavy-italic">Thank you for your order!</h1>
            <p style="font-size: 16px;">Hello <strong>${orderData.customer_name}</strong>,</p>
            <p>We have successfully received your order <span class="order-id">${orderData.order_id}</span>. Our team will start processing it shortly.</p>
            
            <div class="details-box">
                <h3 style="margin-top:0; border-bottom: 2px solid #000; padding-bottom: 10px; display: inline-block;">Order Summary</h3>
                <p><strong>Date:</strong> ${orderData.order_date || 'N/A'}</p>
                <p><strong>Delivery Method:</strong> <span class="badge">${orderData.delivery_method.toUpperCase()}</span></p>
                <div style="margin-top: 20px;">
                    ${orderData.order_items.split('\n').filter(line => line.trim() !== '').map(item => `<div class="item">${item}</div>`).join('')}
                </div>
                <div class="total">Total: ${orderData.total_price}</div>
            </div>
            
            <p style="margin-top: 30px; font-size: 13px; color: #666;">If you have any questions regarding your design or turnaround time, please reply directly to this email.</p>
        </div>
        <div class="footer">
            © 2026 Square Foot Printing - Las Vegas<br>
            6155 S Edmond St, Las Vegas, NV 89118
        </div>
    </div>
</body>
</html>
`;

/**
 * 2. STORAGE CONFIGURATION (MULTER)
 */
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

/**
 * 3. MAIN ORDER ROUTE
 */
app.post('/api/place-order', upload.array('files'), async (req, res) => {
    try {
        const orderData = JSON.parse(req.body.data);
        const files = req.files || [];

        // Mailtrap configuration (Development)
        const transporter = nodemailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: "09ee2ace2fcb4c",
                pass: "8a7eee9541e016"
            }
        });

        const mailOptions = {
            from: '"Square Foot Printing" <pulopez20@gmail.com>',
            // Copy sent to admin and customer
            to: `za19012245@zapopan.tecmm.edu.mx, ${orderData.customer_email}`,
            subject: `Order Confirmation: ${orderData.order_id}`,
            html: emailTemplate(orderData),
            attachments: files.map(file => ({
                filename: file.originalname,
                path: file.path
            }))
        };

        await transporter.sendMail(mailOptions);
        res.status(200).send({ message: 'Order processed successfully' });

    } catch (error) {
        console.error("Server Error Detailed:", error);
        res.status(500).send('Error processing order');
    }
});

/**
 * 4. SERVER INITIALIZATION
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

//actualizacion