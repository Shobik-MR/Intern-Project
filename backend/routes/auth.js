// ──────────────────────────────────────────────────────────────
// routes/auth.js  –  Register & Login endpoints
// ──────────────────────────────────────────────────────────────
const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');

const router = express.Router();

/**
 * Helper – generate a signed JWT for a user.
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ── POST /api/auth/register ─────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, department, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Create new user (password is hashed by the pre‑save hook)
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      department,
      phone,
    });

    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id:         user._id,
        name:       user.name,
        email:      user.email,
        role:       user.role,
        department: user.department,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── POST /api/auth/login ────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Need to explicitly select the password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id:         user._id,
        name:       user.name,
        email:      user.email,
        role:       user.role,
        department: user.department,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── GET /api/auth/me  –  get current logged‑in user ─────────
const { protect } = require('../middleware/auth');

router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
