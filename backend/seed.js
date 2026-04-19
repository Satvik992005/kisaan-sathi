const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kisaan_sathi';

const dummySellerIds = [
  new mongoose.Types.ObjectId(),
  new mongoose.Types.ObjectId(),
  new mongoose.Types.ObjectId(),
  new mongoose.Types.ObjectId()
];

const seedProducts = [
  { name: 'Organic Premium Wheat', description: 'Freshly harvested organic wheat from the farms of Punjab.', price: 2300, quantity: 50, unit: 'quintal', location: 'Ludhiana, Punjab', category: 'grain', emoji: '🌾', sellerId: dummySellerIds[0], sellerName: 'Ramesh Singh' },
  { name: 'Red Onion (Nashik)', description: 'Export quality dry red onions.', price: 1500, quantity: 200, unit: 'quintal', location: 'Nashik, Maharashtra', category: 'vegetable', emoji: '🧅', sellerId: dummySellerIds[1], sellerName: 'Sanjay Patil' },
  { name: 'Fresh Tomatoes', description: 'Juicy red tomatoes directly from the farm.', price: 30, quantity: 500, unit: 'kg', location: 'Kolar, Karnataka', category: 'vegetable', emoji: '🍅', sellerId: dummySellerIds[2], sellerName: 'Krishna Reddy' },
  { name: 'Alphonso Mango', description: 'Sweet and premium Alphonso mangoes, handpicked.', price: 800, quantity: 50, unit: 'dozen', location: 'Ratnagiri, Maharashtra', category: 'fruit', emoji: '🥭', sellerId: dummySellerIds[1], sellerName: 'Vinayak Desai' },
  { name: 'Basmati Rice (Export Grade)', description: 'Long grain, aromatic basmati rice.', price: 3500, quantity: 100, unit: 'quintal', location: 'Karnal, Haryana', category: 'grain', emoji: '🍚', sellerId: dummySellerIds[0], sellerName: 'Gurpreet Singh' },
  { name: 'Green Chilli (Spicy)', description: 'Fresh green chillies with high pungency.', price: 40, quantity: 200, unit: 'kg', location: 'Guntur, Andhra Pradesh', category: 'spice', emoji: '🌶️', sellerId: dummySellerIds[3], sellerName: 'Venkatesh Rao' },
  { name: 'Toor Dal (Pigeon Pea)', description: 'Unpolished toor dal directly harvested.', price: 110, quantity: 300, unit: 'kg', location: 'Latur, Maharashtra', category: 'pulse', emoji: '🧆', sellerId: dummySellerIds[1], sellerName: 'Arjun Kale' },
  { name: 'Raw Turmeric', description: 'Rich in curcumin, fresh whole turmeric roots.', price: 65, quantity: 150, unit: 'kg', location: 'Erode, Tamil Nadu', category: 'spice', emoji: '🪴', sellerId: dummySellerIds[2], sellerName: 'Muthusamy' },
  { name: 'Fresh Potatoes', description: 'Large size potatoes excellent for storage.', price: 18, quantity: 1000, unit: 'kg', location: 'Agra, UP', category: 'vegetable', emoji: '🥔', sellerId: dummySellerIds[0], sellerName: 'Rajesh Kumar' },
  { name: 'Kashmiri Apples', description: 'Crisp and sweet apples from the valleys of Kashmir.', price: 120, quantity: 200, unit: 'kg', location: 'Sopore, J&K', category: 'fruit', emoji: '🍎', sellerId: dummySellerIds[3], sellerName: 'Tariq Ahmed' },
  { name: 'Mustard Seeds', description: 'Black mustard seeds for oil extraction.', price: 55, quantity: 400, unit: 'kg', location: 'Alwar, Rajasthan', category: 'oilseed', emoji: '🌼', sellerId: dummySellerIds[2], sellerName: 'Hanuman Ram' },
  { name: 'Sunflower Seeds', description: 'High yield sunflower seeds.', price: 45, quantity: 300, unit: 'kg', location: 'Davangere, Karnataka', category: 'oilseed', emoji: '🌻', sellerId: dummySellerIds[1], sellerName: 'Pradeep Gowda' },
  { name: 'Fresh Carrots', description: 'Sweet orange carrots.', price: 30, quantity: 150, unit: 'kg', location: 'Ooty, Tamil Nadu', category: 'vegetable', emoji: '🥕', sellerId: dummySellerIds[3], sellerName: 'Ramesh Babu' },
  { name: 'Green Peas', description: 'Fresh green peas directly from pod.', price: 60, quantity: 100, unit: 'kg', location: 'Shimla, HP', category: 'vegetable', emoji: '🫛', sellerId: dummySellerIds[0], sellerName: 'Amit Sharma' },
  { name: 'Garlic Bulbs', description: 'Large clove garlics.', price: 120, quantity: 80, unit: 'kg', location: 'Mandsaur, MP', category: 'spice', emoji: '🧄', sellerId: dummySellerIds[2], sellerName: 'Dilip Jain' }
];

async function seedDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');
    await Product.insertMany(seedProducts);
    console.log('Successfully seeded database with varied agricultural products!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding DB:', err);
    process.exit(1);
  }
}

seedDB();
