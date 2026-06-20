import express from 'express';
import Donation from '../models/Donation.js';
import Inventory from '../models/Inventory.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/donations — all donations (verifier/admin) or own (donor)
router.get('/', protect, async (req, res) => {
  try {
    let donations;
    if (req.user.role === 'donor') {
      donations = await Donation.find({ donorEmail: req.user.email }).sort({ createdAt: -1 });
    } else {
      donations = await Donation.find().sort({ createdAt: -1 });
    }
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/donations — submit a donation (donor only)
router.post('/', protect, requireRole('donor'), async (req, res) => {
  try {
    const { medicineName, category, quantity, expiryDate, packageCondition, pickupPreference, notes } = req.body;

    // Expiry must be at least 90 days from now
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
    if (diffDays < 90)
      return res.status(400).json({ message: 'Medicine must have at least 3 months of shelf-life remaining.' });

    const donation = await Donation.create({
      medicineName, category, quantity: Number(quantity),
      expiryDate, packageCondition, pickupPreference,
      notes: notes || '',
      donorName: req.user.name,
      donorEmail: req.user.email,
      status: 'Pending',
    });
    res.status(201).json(donation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/donations/:id/approve — verifier approves
router.put('/:id/approve', protect, requireRole('verifier', 'admin'), async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found.' });
    if (donation.status !== 'Pending')
      return res.status(400).json({ message: 'Only pending donations can be approved.' });

    donation.status = 'Approved';
    donation.verifiedBy = req.user.name;
    await donation.save();

    // Add to inventory (merge if same medicine+expiry exists)
    const existing = await Inventory.findOne({
      medicineName: { $regex: new RegExp(`^${donation.medicineName}$`, 'i') },
      expiryDate: donation.expiryDate,
      category: donation.category,
    });

    if (existing) {
      existing.quantity += Number(donation.quantity);
      await existing.save();
    } else {
      await Inventory.create({
        donationId: donation._id,
        medicineName: donation.medicineName,
        category: donation.category,
        quantity: Number(donation.quantity),
        expiryDate: donation.expiryDate,
        packageCondition: donation.packageCondition,
      });
    }

    res.json(donation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/donations/:id/reject — verifier rejects
router.put('/:id/reject', protect, requireRole('verifier', 'admin'), async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason) return res.status(400).json({ message: 'Rejection reason is required.' });

    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found.' });
    if (donation.status !== 'Pending')
      return res.status(400).json({ message: 'Only pending donations can be rejected.' });

    donation.status = 'Rejected';
    donation.rejectionReason = rejectionReason;
    donation.verifiedBy = req.user.name;
    await donation.save();

    res.json(donation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
