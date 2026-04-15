# 🌾 Kisaan Sathi – Smart Agriculture & Marketplace Platform

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7+-green)](https://mongodb.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Integrated-blue)](https://razorpay.com/)

A full-stack, production-ready web application empowering Indian farmers with intelligent crop guidance, a digital marketplace, and real-time communication.

---

## ✅ Features

| Feature | Status |
|---|---|
| JWT Authentication (login/register) | ✅ |
| Farmer Dashboard – Add & manage crops | ✅ |
| Marketplace with search & filter | ✅ |
| Cart + Checkout flow | ✅ |
| Razorpay Payment Integration | ✅ |
| Crop Recommendation (JS Rule Engine) | ✅ |
| Real-Time Chat (Socket.IO) | ✅ |
| Order History | ✅ |
| Responsive Mobile UI | ✅ |

---

## 🗂️ Project Structure

```
Kisaan Sathi/
├── backend/
│   ├── config/db.js              # MongoDB connection
│   ├── middleware/auth.js        # JWT middleware
│   ├── models/                   # Mongoose schemas
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Message.js
│   │   └── Payment.js
│   ├── routes/                   # Express API routes
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── payment.js
│   │   ├── crop.js
│   │   └── chat.js
│   ├── utils/cropRecommendation.js  # Rule-based crop engine
│   ├── server.js                 # Entry point (Express + Socket.IO)
│   ├── .env                      # Environment variables (edit this!)
│   └── package.json
└── frontend/
    ├── index.html                # Single Page Application
    ├── css/style.css             # Complete stylesheet
    └── js/
        ├── config.js             # API URL & helpers
        ├── toast.js              # Notification system
        ├── auth.js               # Login / Register
        ├── marketplace.js        # Product listing
        ├── cart.js               # Cart management
        ├── checkout.js           # Razorpay checkout
        ├── dashboard.js          # Farmer dashboard + orders
        ├── crop.js               # Crop advisor
        ├── chat.js               # Socket.IO chat
        └── app.js                # Main SPA controller
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js 18+](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally on port 27017)
- [MongoDB Compass](https://www.mongodb.com/products/compass) (optional, for GUI)
- Razorpay test account (free at [razorpay.com](https://razorpay.com/))

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/kisaan_sathi
JWT_SECRET=your_super_secret_key
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=YYYYYYYYYYYYYYYYYYYY
```

> Get your Razorpay test keys from: Dashboard → API Keys → Generate Test Key

### 3. Start MongoDB

Make sure MongoDB is running. If installed as a service, it usually starts automatically.
Or run: `mongod`

### 4. Start the Server

```bash
cd backend
npm run dev     # Development (with nodemon, auto-restart)
# OR
npm start       # Production
```

### 5. Open the App

Visit **http://localhost:5000** in your browser.

---

## 🌐 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login & get JWT |
| GET | `/api/auth/me` | Yes | Get current user |
| GET | `/api/products` | No | List all products |
| POST | `/api/products` | Yes | Add new product (farmer) |
| DELETE | `/api/products/:id` | Yes | Remove product |
| POST | `/api/orders` | Yes | Place order |
| GET | `/api/orders/my` | Yes | Get my orders |
| POST | `/api/payment/create-order` | Yes | Create Razorpay order |
| POST | `/api/payment/verify` | Yes | Verify payment |
| POST | `/api/crop/recommend` | No | Get crop recommendations |
| GET | `/api/chat/users` | Yes | Get all users for chat |
| GET | `/api/chat/history/:userId` | Yes | Get chat history |

---

## 💳 Payment Flow

1. User adds items to cart
2. Proceeds to checkout → fills delivery address
3. Backend creates a Razorpay order (`/api/payment/create-order`)
4. Razorpay modal opens (test/live mode)
5. On success → backend verifies signature (`/api/payment/verify`)
6. Order updated to `completed` in MongoDB

> **Test Cards**: Use card `4111 1111 1111 1111`, any future date, any CVV

---

## 🌱 Crop Recommendation Engine

The rule-based JS engine (`backend/utils/cropRecommendation.js`) scores **15 crops** across:
- **Soil type** (clay, loam, sandy, silt, black, red)
- **Temperature** (weighted range fit)
- **Humidity** (weighted range fit)
- **Annual rainfall** (weighted range fit)

Returns top 3 crops with confidence % score.

---

## 📦 Deployment

### Backend → Render
1. Connect GitHub repo
2. Set environment variables in Render dashboard
3. Set Start Command: `node server.js`

### Frontend → Vercel / Netlify
- Frontend is served by Express from `frontend/` folder
- Or deploy `frontend/` folder separately to Netlify
- Update `API_URL` in `frontend/js/config.js` to your Render URL

---

## 🔐 Security
- Passwords hashed with **bcrypt (10 rounds)**
- Routes protected with **JWT middleware**
- Razorpay signature **HMAC-SHA256 verification**
- CORS enabled for API

---

## 👨‍💻 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JS |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| Payments | Razorpay |
| Real-time | Socket.IO |
| Fonts | Google Fonts (Inter, Space Grotesk) |

---

*Built with ❤️ for Indian farmers*
