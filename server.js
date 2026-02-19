const express = require('express');
const multer = require('multer');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// CONFIGURACIÓN DE ALMACENAMIENTO
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

// RUTA PARA RECIBIR EL PEDIDO
app.post('/api/place-order', upload.array('files'), async (req, res) => {
    try {
        const orderData = JSON.parse(req.body.data);
        const files = req.files;

        // CONFIGURA TU CORREO AQUÍ
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'TU_CORREO@gmail.com',
                pass: 'TU_CONTRASEÑA_DE_APLICACION'
            }
        });

        const mailOptions = {
            from: 'Square Foot Printing Web',
            to: 'za19012245@zapopan.tecmm.edu.mx',
            subject: `New Order from ${orderData.customer_name}`,
            text: `Customer: ${orderData.customer_name}\nTotal: ${orderData.total_price}\nFiles received: ${files.length}`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).send({ message: 'Order processed successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing order');
    }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));