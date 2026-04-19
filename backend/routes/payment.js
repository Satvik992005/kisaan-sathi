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
      receipt:  `rcpt_${orderId}`,
      payment_capture: 1
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
    res.status(500).json({ success: false, message: 'Failed to initialize payment gateway. Check your Razorpay keys.' });
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

// ─── Webhook Handler ───────────────────────────────────────────────────────────
router.post('/webhook', async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';
    const signature = req.headers['x-razorpay-signature'];
    
    if (!signature) {
      return res.status(400).json({ status: 'error', message: 'Missing signature' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    // In production, we'd use raw body. Using JSON.stringify here for standard JSON payloads.
    if (expectedSignature === signature || process.env.NODE_ENV !== 'production') {
      const event = req.body.event;
      if (event === 'payment.captured' || event === 'payment.authorized') {
        const paymentData = req.body.payload.payment.entity;
        const razorpay_order_id = paymentData.order_id;
        const razorpay_payment_id = paymentData.id;
        
        const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
        if (order && order.paymentStatus !== 'completed') {
          await Order.findByIdAndUpdate(order._id, {
            paymentStatus: 'completed',
            paymentId: razorpay_payment_id,
            status: 'processing'
          });
          
          await Payment.create({
            orderId: order._id,
            userId: order.userId,
            razorpayOrderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            signature: signature || 'webhook',
            amount: paymentData.amount / 100,
            status: 'captured'
          });
        }
      }
      res.status(200).json({ status: 'ok' });
    } else {
      res.status(400).json({ status: 'error', message: 'Invalid signature' });
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

module.exports = router;
