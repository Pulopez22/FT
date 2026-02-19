const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const upload = multer();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/place-order', upload.none(), async (req, res) => {
    try {
        // En esta versión original, los datos venían dentro de req.body.data
        const orderData = JSON.parse(req.body.data);
        const { customer, items, total } = orderData;

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
                CUSTOMER: ${customer.name}
                EMAIL: ${customer.email}
                PHONE: ${customer.phone}
                ADDRESS: ${customer.address}

                TOTAL: ${total}

                ITEMS:
                ${JSON.stringify(items, null, 2)}
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).send('Order placed successfully');

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).send('Error processing order');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));