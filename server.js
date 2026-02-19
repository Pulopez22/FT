const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

// Permitimos explícitamente tu dominio de Vercel para evitar bloqueos
app.use(cors({
    origin: '*', // Esto permite peticiones de cualquier lugar para pruebas
    methods: ['POST', 'GET']
}));

app.use(express.json());

app.post('/api/place-order', async (req, res) => {
    try {
        const { customer, items, total } = req.body;
        
        // Si no hay datos, lanzamos error claro
        if (!customer || !items) throw new Error("No data received");

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'pulopez20@gmail.com',
                pass: 'svik ahzr txww cerv'
            }
        });

        const mailOptions = {
            from: '"Square Foot Order" <pulopez20@gmail.com>',
            to: 'za19012245@zapopan.tecmm.edu.mx',
            subject: `ORDER: ${customer.name}`,
            text: `Customer: ${customer.name}\nTotal: ${total}\nItems: ${JSON.stringify(items)}`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("ERROR:", error.message);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live on ${PORT}`));