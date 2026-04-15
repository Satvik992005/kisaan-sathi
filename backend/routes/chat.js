const express = require('express');
const router  = express.Router();
const Message = require('../models/Message');
const User    = require('../models/User');
const auth    = require('../middleware/auth');

// ─── Get All Users (for chat list) ───────────────────────────────────────────
router.get('/users', auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } }).select('name email role location');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── Chat History Between Two Users ──────────────────────────────────────────
router.get('/history/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.user.id, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.user.id }
      ]
    }).sort({ timestamp: 1 }).limit(100);

    // Mark as read
    await Message.updateMany(
      { senderId: req.params.userId, receiverId: req.user.id, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
