import express from 'express';
import Inventory from '../models/Inventory.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/inventory — get all available stock (quantity > 0)
router.get('/', protect, async (req, res) => {
  try {
    const inventory = await Inventory.find({ quantity: { $gt: 0 } }).sort({ createdAt: -1 });
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
