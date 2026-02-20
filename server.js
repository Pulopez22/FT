const express = require('express');
const multer = require('multer');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

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

        // CONFIGURACIÓN OBLIGATORIA PARA RENDER (Puerto 587)
        let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // STARTTLS
    auth: {
        user: 'pulopez20@gmail.com',
        pass: 'svik ahzr txww cerv' // RECUERDA: Si usas verificación en 2 pasos, esto DEBE ser una "Contraseña de Aplicación"
    },
    tls: {
        rejectUnauthorized: false,
        minVersion: "TLSv1.2"
    },
    connectionTimeout: 20000, // Aumentamos a 20 segundos
    greetingTimeout: 20000,
    socketTimeout: 20000
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
                ----------------------
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).send({ message: 'Order processed successfully' });

    } catch (error) {
        console.error("Server Error Detailed:", error);
        res.status(500).send('Error processing order');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));