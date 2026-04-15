const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price:       { type: Number, required: true, min: 0 },
  quantity:    { type: Number, required: true, min: 0 },
  unit:        { type: String, default: 'kg' },
  location:    { type: String, required: true },
  category:    {
    type: String,
    enum: ['grain', 'vegetable', 'fruit', 'pulse', 'oilseed', 'spice', 'other'],
    default: 'grain'
  },
  emoji:       { type: String, default: '🌾' },
  sellerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerName:  { type: String },
  isAvailable: { type: Boolean, default: true },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
