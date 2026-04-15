const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const Razorpay = require('razorpay');
const auth     = require('../middleware/auth');
const Payment  = require('../models/Payment');
const Order    = require('../models/Order');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID     || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret'
});

// ─── Create Razorpay Order ─────────────────────────────────────────────────────
router.post('/create-order', auth, async (req, res) => {
  try {
    const { amount, orderId } = req.body;
    if (!amount || amount <= 0)
      return res.status(400).json({ success: false, message: 'Invalid amount.' });

    const options = {
      amount:   Math.round(amount * 100), // paise
      currency: 'INR',
      receipt:  `ks_${orderId}_${Date.now()}`
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.json({
      success:  true,
      orderId:  razorpayOrder.id,
      amount:   razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key:      process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder'
    });
  } catch (err) {
    console.error('Razorpay create-order error:', err);
    res.status(500).json({ success: false, message: 'Payment initialization failed. Check Razorpay keys.' });
  }
});

// ─── Verify Payment ────────────────────────────────────────────────────────────
router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId, amount } = req.body;

    // Signature verification
    const body      = razorpay_order_id + '|' + razorpay_payment_id;
    const expected  = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature)
      return res.status(400).json({ success: false, message: 'Payment verification failed.' });

    // Save payment record
    await Payment.create({
      orderId,
      userId:          req.user.id,
      razorpayOrderId: razorpay_order_id,
      paymentId:       razorpay_payment_id,
      signature:       razorpay_signature,
      amount:          Number(amount),
      status:          'captured'
    });

    // Update order
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus:   'completed',
      paymentId:       razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      status:          'processing'
    });

    res.json({ success: true, message: 'Payment verified! Order confirmed. 🎉', paymentId: razorpay_payment_id });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ success: false, message: 'Server error during verification.' });
  }
});

module.exports = router;
