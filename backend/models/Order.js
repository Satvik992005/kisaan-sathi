const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [
    {
      productId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name:       { type: String },
      price:      { type: Number },
      quantity:   { type: Number },
      emoji:      { type: String }
    }
  ],
  totalAmount:      { type: Number, required: true },
  shippingAddress:  { type: String, default: '' },
  paymentStatus:    { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  paymentId:        { type: String, default: '' },
  razorpayOrderId:  { type: String, default: '' },
  status:           {
    type: String,
    enum: ['placed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'placed'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
