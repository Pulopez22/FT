const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json()); // Essential to read the JSON sent from checkout.html

// ORDER RECEPTION ROUTE
app.post('/api/place-order', async (req, res) => {
    try {
        // Receiving data directly from req.body
        const { customer, items, total } = req.body;

        if (!customer || !items) {
            return res.status(400).send('Missing order data');
        }

        // Formatting products and their dynamic options for the email
        const orderDetails = items.map(item => {
            return `- ${item.product}: $${item.price}\n  Details: ${item.details}`;
        }).join('\n\n');

        // EMAIL CONFIGURATION
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
            subject: `New Order Received from ${customer.name}`,
            text: `
NEW ORDER DETAILS
----------------------------
CUSTOMER INFO:
Name: ${customer.name}
Email: ${customer.email}
Phone: ${customer.phone}
Address: ${customer.address}

ORDER ITEMS:
${orderDetails}

ORDER TOTAL: ${total}
----------------------------
`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).send({ message: 'Order processed successfully' });

    } catch (error) {
        console.error('SERVER ERROR:', error);
        res.status(500).send('Error processing order: ' + error.message);
    }
});

// Dynamic port assignment for Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));