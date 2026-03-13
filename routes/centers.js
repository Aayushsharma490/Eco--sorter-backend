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

// @route   GET /api/centers
// @desc    Get all collection centers
// @access  Public
router.get('/', (req, res) => {
  try {
    const db = getDB();
    const centers = db.centers.filter(c => c.isActive);

    res.json({
      success: true,
      count: centers.length,
      data: centers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/centers
// @desc    Create collection center
// @access  Private (Admin)
router.post('/', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can create centers' });
    }

    const db = getDB();
    const newCenter = {
      id: `center${Date.now()}`,
      ...req.body,
      isActive: true,
      totalCollections: 0,
      createdAt: new Date().toISOString()
    };

    db.centers.push(newCenter);
    saveDB(db);

    res.status(201).json({
      success: true,
      data: newCenter
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/centers/:id
// @desc    Update collection center
// @access  Private (Admin)
router.put('/:id', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can update centers' });
    }

    const db = getDB();
    const centerIndex = db.centers.findIndex(c => c.id === req.params.id);

    if (centerIndex === -1) {
      return res.status(404).json({ success: false, message: 'Center not found' });
    }

    db.centers[centerIndex] = {
      ...db.centers[centerIndex],
      ...req.body,
      id: req.params.id
    };

    saveDB(db);

    res.json({
      success: true,
      data: db.centers[centerIndex]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/centers/:id
// @desc    Delete collection center
// @access  Private (Admin)
router.delete('/:id', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can delete centers' });
    }

    const db = getDB();
    const centerIndex = db.centers.findIndex(c => c.id === req.params.id);

    if (centerIndex === -1) {
      return res.status(404).json({ success: false, message: 'Center not found' });
    }

    db.centers.splice(centerIndex, 1);
    saveDB(db);

    res.json({
      success: true,
      message: 'Center deleted'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
