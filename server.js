const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json()); // Vital para leer el JSON del checkout

app.post('/api/place-order', async (req, res) => {
    try {
        // Leemos los datos tal como los envía el checkout nuevo
        const { customer, items, total } = req.body;

        if (!customer || !items) {
            return res.status(400).send('Missing order data');
        }

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
        res.status(200).json({ message: 'Order processed successfully' });

    } catch (error) {
        console.error('SERVER ERROR:', error);
        res.status(500).send('Error processing order: ' + error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));