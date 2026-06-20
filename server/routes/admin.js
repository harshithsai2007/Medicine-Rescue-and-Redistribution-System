import express from 'express';
import User from '../models/User.js';
import Donation from '../models/Donation.js';
import Inventory from '../models/Inventory.js';
import Request from '../models/Request.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/admin/charities — all charity registrations (pending + verified)
router.get('/charities', protect, requireRole('admin'), async (req, res) => {
  try {
    const charities = await User.find({ role: 'charity' }).select('-password');
    res.json(charities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/charities/:id/approve
router.put('/charities/:id/approve', protect, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'charity') return res.status(404).json({ message: 'Charity not found.' });
    user.verified = true;
    await user.save();
    res.json({ message: 'Charity verified successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/charities/:id/reject
router.delete('/charities/:id/reject', protect, requireRole('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Charity registration rejected and removed.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/stats — dashboard metrics
router.get('/stats', protect, requireRole('admin'), async (req, res) => {
  try {
    const donations = await Donation.find();
    const requests = await Request.find();
    const inventory = await Inventory.find();
    const users = await User.find();

    const medicinesRescued = donations
      .filter(d => d.status === 'Approved')
      .reduce((sum, d) => sum + d.quantity, 0);

    const patientsHelped = requests
      .filter(r => r.status === 'Delivered')
      .reduce((sum, r) => sum + r.quantity, 0);

    const connectedCharities = users.filter(u => u.role === 'charity' && u.verified).length;
    const completedDonations = donations.filter(d => d.status === 'Approved').length;
    const pendingDonationsCount = donations.filter(d => d.status === 'Pending').length;
    const pendingRequestsCount = requests.filter(r => r.status === 'Pending').length;
    const pendingCharitiesCount = users.filter(u => u.role === 'charity' && !u.verified).length;

    const inventoryCategories = inventory.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.quantity;
      return acc;
    }, {});

    res.json({
      medicinesRescued,
      patientsHelped,
      connectedCharities,
      completedDonations,
      pendingDonationsCount,
      pendingRequestsCount,
      pendingCharitiesCount,
      inventoryCategories,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users — all users
router.get('/users', protect, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
