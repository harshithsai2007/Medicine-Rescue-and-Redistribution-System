import express from 'express';
import Request from '../models/Request.js';
import Inventory from '../models/Inventory.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/requests — charity sees own, admin sees all
router.get('/', protect, async (req, res) => {
  try {
    let requests;
    if (req.user.role === 'charity') {
      requests = await Request.find({ charityEmail: req.user.email }).sort({ createdAt: -1 });
    } else {
      requests = await Request.find().sort({ createdAt: -1 });
    }
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/requests — charity submits a request
router.post('/', protect, requireRole('charity'), async (req, res) => {
  try {
    const { inventoryId, quantity } = req.body;
    const qty = Number(quantity);

    const invItem = await Inventory.findById(inventoryId);
    if (!invItem) return res.status(404).json({ message: 'Medicine not found in inventory.' });
    if (invItem.quantity < qty)
      return res.status(400).json({ message: `Only ${invItem.quantity} units available.` });

    const request = await Request.create({
      inventoryId,
      medicineName: invItem.medicineName,
      category: invItem.category,
      quantity: qty,
      charityName: req.user.name,
      charityEmail: req.user.email,
      status: 'Pending',
    });

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/requests/:id/approve — admin approves, deducts inventory
router.put('/:id/approve', protect, requireRole('admin'), async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (request.status !== 'Pending')
      return res.status(400).json({ message: 'Only pending requests can be approved.' });

    const invItem = await Inventory.findById(request.inventoryId);
    if (!invItem || invItem.quantity < request.quantity)
      return res.status(400).json({ message: 'Insufficient stock to approve this request.' });

    invItem.quantity -= request.quantity;
    if (invItem.quantity <= 0) {
      await invItem.deleteOne();
    } else {
      await invItem.save();
    }

    request.status = 'Approved';
    request.dateUpdated = new Date().toISOString().split('T')[0];
    await request.save();

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/requests/:id/deliver — admin marks as delivered
router.put('/:id/deliver', protect, requireRole('admin'), async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });

    request.status = 'Delivered';
    request.dateUpdated = new Date().toISOString().split('T')[0];
    await request.save();

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
