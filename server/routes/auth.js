import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, address, type, contactPerson } = req.body;

    if (!name || !email || !password || !role)
      return res.status(400).json({ message: 'Name, email, password, and role are required.' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered.' });

    // Charity orgs need admin verification before login
    const verified = role === 'charity' ? false : true;

    const user = await User.create({
      name, email, password, role, phone, address,
      type: type || '', contactPerson: contactPerson || '', verified
    });

    res.status(201).json({
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      verified: user.verified,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password.' });

    if (user.role === 'charity' && !user.verified)
      return res.status(403).json({ message: 'Your organization account is pending administrator verification.' });

    res.json({
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      verified: user.verified,
      type: user.type,
      contactPerson: user.contactPerson,
      address: user.address,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
