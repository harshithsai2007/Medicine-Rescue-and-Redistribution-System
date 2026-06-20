import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from '../server/db/mongoose.js';
import authRoutes from '../server/routes/auth.js';
import donationRoutes from '../server/routes/donations.js';
import inventoryRoutes from '../server/routes/inventory.js';
import requestRoutes from '../server/routes/requests.js';
import adminRoutes from '../server/routes/admin.js';

const app = express();

// DB connection caching for serverless environments
let isConnected = false;
const ensureConnected = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
};

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://medicine-rescue-and-redistribution.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}));
app.use(express.json());

// Routes — Vercel forwards the full /api/... path to this function
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'MRRS API is running on Vercel.' }));

// 404 fallback
app.use((req, res) => res.status(404).json({ message: `Route ${req.originalUrl} not found.` }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error.' });
});

// Vercel serverless export
export default async (req, res) => {
  await ensureConnected();
  return app(req, res);
};
