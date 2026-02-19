const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json()); // Vital para leer los datos del Checkout

app.post('/api/place-order', async (req, res) => {
    try {
        const { customer, items, total } = req.body;

        // Formateamos los detalles para el correo
        const orderDetails = items.map(item => {
            return `- ${item.product}: $${item.price}\n  Details: ${item.details}`;
        }).join('\n\n');

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'pulopez20@gmail.com',
                pass: 'svik ahzr txww cerv'
            }
        });

        const mailOptions = {
            from: '"Square Foot Printing" <pulopez20@gmail.com>',
            to: 'za19012245@zapopan.tecmm.edu.mx',
            subject: `NEW ORDER: ${customer.name}`,
            text: `
NEW ORDER RECEIVED
----------------------------
CUSTOMER:
Name: ${customer.name}
Email: ${customer.email}
Phone: ${customer.phone}
Address: ${customer.address}

ITEMS:
${orderDetails}

TOTAL: ${total}
----------------------------
`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).send({ message: 'Order received' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error: ' + error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live on ${PORT}`));