const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        productName: String,
        category: String,
        quantity: Number,
        price: Number,
        options: Object // Para guardar specs como "Grommets", "Lamination", etc.
    }],
    totalAmount: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['Pending', 'Processing', 'Printing', 'Shipped', 'Completed'], 
        default: 'Pending' 
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);