const express = require('express');
const multer = require('multer');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Configuración para guardar físicamente en la carpeta uploads
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

app.post('/api/place-order', upload.array('files'), async (req, res) => {
    try {
        const orderData = JSON.parse(req.body.data);
        const files = req.files || [];

        // Configuración de Mailtrap para evitar bloqueos en Render
        var transporter = nodemailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: "09ee2ace2fcb4c", // Tu usuario real
                pass: "8a7eee9541e016"  // Tu password real
            }
        });

        const mailOptions = {
            from: '"Square Foot Printing" <pulopez20@gmail.com>',
            to: `za19012245@zapopan.tecmm.edu.mx, ${orderData.customer_email}`,
            subject: `New Order: ${orderData.customer_name}`,
            text: `
                ORDER DETAILS
                ----------------------
                Customer: ${orderData.customer_name}
                Email: ${orderData.customer_email}
                Phone: ${orderData.customer_phone}
                Method: ${orderData.delivery_method}
                
                ARTICLES:
                ${orderData.order_items}

                TOTAL: ${orderData.total_price}
                IMAGES SAVED IN SERVER: ${files.length}
                ----------------------
            `,
            // Adjunta las imágenes de los productos al correo
            attachments: files.map(file => ({
                filename: file.originalname,
                path: file.path 
            }))
        };

        await transporter.sendMail(mailOptions);
        res.status(200).send({ message: 'Order processed and images saved' });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).send('Error processing order');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));