const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json()); // Esto permite que el servidor lea los datos del checkout

app.post('/api/place-order', async (req, res) => {
    try {
        const { customer, items, total } = req.body;

        // Si el servidor recibe "undefined", aquí lo atrapamos antes de que truene
        if (!customer || !items) {
            return res.status(400).send('Error: Datos incompletos');
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'pulopez20@gmail.com',
                pass: 'svik ahzr txww cerv'
            }
        });

        const mailOptions = {
            from: '"Square Foot Printing" <pulopez20@gmail.com>',
            to: 'za19012245@zapopan.tecmm.edu.mx',
            subject: `NUEVA ORDEN: ${customer.name}`,
            text: `Cliente: ${customer.name}\nTotal: ${total}\nArtículos: ${JSON.stringify(items)}`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Error en el servidor:', error);
        res.status(500).send('Error interno: ' + error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor listo en puerto ${PORT}`));