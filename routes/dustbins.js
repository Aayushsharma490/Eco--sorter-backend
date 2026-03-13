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

// @route   GET /api/dustbins
// @desc    Get all dustbins
// @access  Private
router.get('/', verifyToken, (req, res) => {
  try {
    const db = getDB();
    let dustbins = db.dustbins;

    if (req.user.role === 'user') {
      dustbins = dustbins.filter(d => d.userId === req.user.id);
    }

    dustbins = dustbins.map(d => ({
      ...d,
      user: db.users.find(u => u.id === d.userId)
    }));

    res.json({
      success: true,
      count: dustbins.length,
      data: dustbins
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/dustbins/critical
// @desc    Get critical dustbins
// @access  Private (Executive, Admin)
router.get('/critical', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'executive' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const db = getDB();
    let dustbins = db.dustbins.filter(d => d.status === 'critical');

    dustbins = dustbins.map(d => ({
      ...d,
      user: db.users.find(u => u.id === d.userId)
    }));

    res.json({
      success: true,
      count: dustbins.length,
      data: dustbins
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/dustbins
// @desc    Create dustbin
// @access  Private (User)
router.post('/', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Only users can create dustbins' });
    }

    const { location } = req.body;
    const db = getDB();

    const newDustbin = {
      id: `dustbin${Date.now()}`,
      userId: req.user.id,
      location,
      level: 0,
      status: 'low',
      lastUpdated: new Date().toISOString()
    };

    db.dustbins.push(newDustbin);
    saveDB(db);

    res.status(201).json({
      success: true,
      data: newDustbin
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/dustbins/:id
// @desc    Update dustbin level
// @access  Private
router.put('/:id', verifyToken, (req, res) => {
  try {
    const { level } = req.body;
    const db = getDB();
    const dustbin = db.dustbins.find(d => d.id === req.params.id);

    if (!dustbin) {
      return res.status(404).json({ success: false, message: 'Dustbin not found' });
    }

    dustbin.level = level;
    dustbin.lastUpdated = new Date().toISOString();
    
    // Update status based on level
    if (level >= 80) {
      dustbin.status = 'critical';
    } else if (level >= 50) {
      dustbin.status = 'moderate';
    } else {
      dustbin.status = 'low';
    }

    saveDB(db);

    res.json({
      success: true,
      data: dustbin
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
