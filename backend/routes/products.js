const express = require('express');
const router  = express.Router();
const Product = require('../models/Product');
const auth    = require('../middleware/auth');

// ─── Get All Products (public) ─────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 24 } = req.query;
    const query = { isAvailable: true };

    if (category && category !== 'all') query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.json({ success: true, products, total, pages: Math.ceil(total / limit), currentPage: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── Get My Products (farmer) ─────────────────────────────────────────────────
router.get('/my/listings', auth, async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── Get Single Product ────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── Add Product (farmer only) ────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, price, quantity, unit, location, category, emoji } = req.body;

    if (!name || !price || !quantity || !location)
      return res.status(400).json({ success: false, message: 'Name, price, quantity and location are required.' });

    const product = await Product.create({
      name, description, price: Number(price), quantity: Number(quantity),
      unit: unit || 'kg', location, category: category || 'grain',
      emoji: emoji || '🌾',
      sellerId: req.user.id, sellerName: req.user.name
    });

    res.status(201).json({ success: true, message: 'Product listed successfully! 🎉', product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── Update Product ────────────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, sellerId: req.user.id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const allowed = ['name', 'description', 'price', 'quantity', 'unit', 'location', 'category', 'emoji', 'isAvailable'];
    allowed.forEach(key => { if (req.body[key] !== undefined) product[key] = req.body[key]; });
    await product.save();

    res.json({ success: true, message: 'Product updated!', product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── Delete Product ────────────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, sellerId: req.user.id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, message: 'Product removed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
