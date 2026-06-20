import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './db/mongoose.js';
import authRoutes from './routes/auth.js';
import donationRoutes from './routes/donations.js';
import inventoryRoutes from './routes/inventory.js';
import requestRoutes from './routes/requests.js';
import adminRoutes from './routes/admin.js';

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'MRRS API is running.' }));

// 404 fallback
app.use((req, res) => res.status(404).json({ message: `Route ${req.originalUrl} not found.` }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 MRRS API Server running on http://localhost:${PORT}`);
});
