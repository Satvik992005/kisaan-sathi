require('dotenv').config();
const express  = require('express');
const http     = require('http');
const socketIO = require('socket.io');
const cors     = require('cors');
const path     = require('path');

const connectDB = require('./config/db');
const Message   = require('./models/Message');

// ─── App Setup ────────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const io     = socketIO(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ─── Connect DB ───────────────────────────────────────────────────────────────
connectDB();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/payment',  require('./routes/payment'));
app.use('/api/crop',     require('./routes/crop'));
app.use('/api/chat',     require('./routes/chat'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Kisaan Sathi API is running 🌾' }));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ─── Socket.IO – Real-Time Chat ───────────────────────────────────────────────
const onlineUsers = new Map(); // userId → socketId

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // User comes online
  socket.on('userOnline', (userId) => {
    onlineUsers.set(String(userId), socket.id);
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
  });

  // Send message
  socket.on('sendMessage', async ({ senderId, receiverId, message }) => {
    try {
      const saved = await Message.create({ senderId, receiverId, message });

      // Deliver to receiver if online
      const receiverSocket = onlineUsers.get(String(receiverId));
      if (receiverSocket) {
        io.to(receiverSocket).emit('receiveMessage', {
          _id:       saved._id,
          senderId,
          receiverId,
          message,
          timestamp: saved.timestamp
        });
      }

      // Confirm to sender
      socket.emit('messageSent', {
        _id:       saved._id,
        senderId,
        receiverId,
        message,
        timestamp: saved.timestamp
      });
    } catch (err) {
      console.error('Socket sendMessage error:', err);
      socket.emit('messageError', { message: 'Failed to send message.' });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    for (const [userId, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Kisaan Sathi Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO enabled`);
  console.log(`🌾 Frontend served at http://localhost:${PORT}\n`);
});
