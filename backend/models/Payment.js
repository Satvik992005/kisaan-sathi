const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  razorpayOrderId:{ type: String },
  paymentId:      { type: String },
  signature:      { type: String },
  amount:         { type: Number, required: true },
  currency:       { type: String, default: 'INR' },
  status:         { type: String, enum: ['created', 'captured', 'failed'], default: 'created' },
  createdAt:      { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
