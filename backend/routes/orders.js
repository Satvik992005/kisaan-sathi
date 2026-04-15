const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const auth    = require('../middleware/auth');

// ─── Create Order ──────────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { products, totalAmount, shippingAddress } = req.body;
    if (!products || !products.length)
      return res.status(400).json({ success: false, message: 'Cart is empty.' });

    const order = await Order.create({
      userId: req.user.id,
      products,
      totalAmount: Number(totalAmount),
      shippingAddress: shippingAddress || ''
    });

    res.status(201).json({ success: true, message: 'Order created.', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── My Orders ────────────────────────────────────────────────────────────────
router.get('/my', auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── Get Order By ID ─────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── Update Payment Status ─────────────────────────────────────────────────────
router.put('/:id/payment', auth, async (req, res) => {
  try {
    const { paymentStatus, paymentId, razorpayOrderId } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        paymentStatus,
        paymentId: paymentId || '',
        razorpayOrderId: razorpayOrderId || '',
        status: paymentStatus === 'completed' ? 'processing' : 'placed'
      },
      { new: true }
    );
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
