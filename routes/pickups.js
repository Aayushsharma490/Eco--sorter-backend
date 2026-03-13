import express from 'express';
import jwt from 'jsonwebtoken';
import { getDB, saveDB } from '../server.js';

const router = express.Router();

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key');
    const db = getDB();
    req.user = db.users.find(u => u.id === decoded.id);
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// @route   GET /api/pickups
// @desc    Get all pickups (filtered by role)
// @access  Private
router.get('/', verifyToken, (req, res) => {
  try {
    const db = getDB();
    let pickups = db.pickups;

    if (req.user.role === 'user') {
      pickups = pickups.filter(p => p.userId === req.user.id);
    } else if (req.user.role === 'executive') {
      pickups = pickups.filter(p => p.executiveId === req.user.id);
    }

    // Populate user data
    pickups = pickups.map(p => ({
      ...p,
      user: db.users.find(u => u.id === p.userId),
      executive: p.executiveId ? db.users.find(u => u.id === p.executiveId) : null
    }));

    res.json({
      success: true,
      count: pickups.length,
      data: pickups
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/pickups/pending
// @desc    Get pending pickups
// @access  Private (Executive, Admin)
router.get('/pending', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'executive' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const db = getDB();
    let pickups = db.pickups.filter(p => p.status === 'pending');

    pickups = pickups.map(p => ({
      ...p,
      user: db.users.find(u => u.id === p.userId)
    }));

    res.json({
      success: true,
      count: pickups.length,
      data: pickups
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/pickups
// @desc    Create new pickup
// @access  Private (User)
router.post('/', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Only users can create pickups' });
    }

    const { scheduledDate, estimatedWeight, address, notes } = req.body;

    const db = getDB();
    const newPickup = {
      id: `pickup${Date.now()}`,
      userId: req.user.id,
      executiveId: null,
      scheduledDate,
      estimatedWeight,
      actualWeight: null,
      address: address || req.user.address,
      status: 'pending',
      creditsEarned: 0,
      notes: notes || '',
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    db.pickups.push(newPickup);
    saveDB(db);

    res.status(201).json({
      success: true,
      data: newPickup
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/pickups/:id/accept
// @desc    Accept pickup
// @access  Private (Executive)
router.put('/:id/accept', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'executive') {
      return res.status(403).json({ success: false, message: 'Only executives can accept pickups' });
    }

    const db = getDB();
    const pickup = db.pickups.find(p => p.id === req.params.id);

    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup not found' });
    }

    pickup.status = 'accepted';
    pickup.executiveId = req.user.id;
    saveDB(db);

    res.json({
      success: true,
      data: pickup
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/pickups/:id/complete
// @desc    Generate OTP for pickup completion
// @access  Private (Executive)
router.put('/:id/complete', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'executive') {
      return res.status(403).json({ success: false, message: 'Only executives can complete pickups' });
    }

    const { actualWeight } = req.body;
    const db = getDB();
    const pickup = db.pickups.find(p => p.id === req.params.id);

    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup not found' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    pickup.otp = otp;
    pickup.otpGeneratedAt = new Date().toISOString();
    if (actualWeight) {
      pickup.actualWeight = actualWeight;
    }
    
    saveDB(db);

    res.json({
      success: true,
      message: 'OTP generated successfully',
      data: {
        pickupId: pickup.id,
        otp: otp,
        expiresIn: '10 minutes'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/pickups/:id/verify-otp
// @desc    Verify OTP and complete pickup
// @access  Private (User)
router.put('/:id/verify-otp', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Only users can verify OTP' });
    }

    const { otp, actualWeight } = req.body;
    const db = getDB();
    const pickup = db.pickups.find(p => p.id === req.params.id);

    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup not found' });
    }

    if (pickup.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!pickup.otp) {
      return res.status(400).json({ success: false, message: 'OTP not generated yet' });
    }

    // Check OTP expiry (10 minutes)
    const otpAge = Date.now() - new Date(pickup.otpGeneratedAt).getTime();
    if (otpAge > 10 * 60 * 1000) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    if (pickup.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Use provided weight or default to estimated weight
    const finalWeight = actualWeight || pickup.estimatedWeight || 10;
    
    // Calculate credits (1kg = 10 credits)
    const creditsEarned = Math.floor(finalWeight * 10);

    pickup.status = 'completed';
    pickup.actualWeight = finalWeight;
    pickup.creditsEarned = creditsEarned;
    pickup.completedAt = new Date().toISOString();
    pickup.otp = null; // Clear OTP
    pickup.otpGeneratedAt = null;

    // Update user credits
    const user = db.users.find(u => u.id === pickup.userId);
    if (user) {
      user.credits = (user.credits || 0) + creditsEarned;
    }

    saveDB(db);

    res.json({
      success: true,
      message: 'Pickup completed successfully!',
      data: {
        pickup,
        creditsEarned,
        totalCredits: user.credits
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/pickups/:id
// @desc    Cancel pickup
// @access  Private
router.delete('/:id', verifyToken, (req, res) => {
  try {
    const db = getDB();
    const pickupIndex = db.pickups.findIndex(p => p.id === req.params.id);

    if (pickupIndex === -1) {
      return res.status(404).json({ success: false, message: 'Pickup not found' });
    }

    const pickup = db.pickups[pickupIndex];

    // Check ownership
    if (pickup.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    db.pickups.splice(pickupIndex, 1);
    saveDB(db);

    res.json({
      success: true,
      message: 'Pickup cancelled'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
