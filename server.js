// server.js — Main Express server entry point for Aptos
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB Atlas
connectDB();

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────

// Enable CORS for all origins (frontend on Netlify talks to this backend)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse incoming JSON request bodies
app.use(express.json());

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/auth',       require('./routes/authRoutes'));
app.use('/api/visitors',   require('./routes/visitorRoutes'));
app.use('/api/staff',      require('./routes/staffRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/payments',   require('./routes/paymentRoutes'));

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Aptos API is running 🏠', timestamp: new Date() });
});

// ─── Root route ───────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Aptos Backend API. Frontend is hosted on Netlify.' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong on the server' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Aptos server running on port ${PORT}`);
  console.log(`🔗 API available at /api`);
});
