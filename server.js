const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/place-order', async (req, res) => {
    try {
        const { customer, items, total } = req.body;
        
        // Validación básica para evitar el Error 500
        if (!customer || !items) {
            return res.status(400).send('Missing data');
        }

        const orderDetails = items.map(item => {
            return `- ${item.product}: $${item.price}\n  Specs: ${item.details}`;
        }).join('\n\n');

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'pulopez20@gmail.com',
                pass: 'svik ahzr txww cerv'
            }
        });

        const mailOptions = {
            from: '"Order System" <pulopez20@gmail.com>',
            to: 'za19012245@zapopan.tecmm.edu.mx',
            subject: `NEW ORDER - ${customer.name}`,
            text: `
CUSTOMER INFO:
Name: ${customer.name}
Email: ${customer.email}
Phone: ${customer.phone}
Address: ${customer.address}

ORDER ITEMS:
${orderDetails}

TOTAL: ${total}
`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).send({ message: 'Success' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Server Error: ' + error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));