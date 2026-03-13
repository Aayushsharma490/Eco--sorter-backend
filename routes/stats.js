import express from 'express';
import jwt from 'jsonwebtoken';
import { getDB } from '../server.js';

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

// @route   GET /api/stats/admin
// @desc    Get admin dashboard stats
// @access  Private (Admin)
router.get('/admin', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const db = getDB();
    
    const totalUsers = db.users.filter(u => u.role === 'user').length;
    const totalExecutives = db.users.filter(u => u.role === 'executive').length;
    const totalCenters = db.centers.filter(c => c.isActive).length;
    
    const completedPickups = db.pickups.filter(p => p.status === 'completed');
    const totalCollections = completedPickups.reduce((sum, p) => sum + (p.actualWeight || 0), 0);

    const criticalDustbins = db.dustbins
      .filter(d => d.status === 'critical')
      .map(d => ({
        ...d,
        user: db.users.find(u => u.id === d.userId)
      }))
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalExecutives,
        totalCenters,
        totalCollections,
        criticalDustbins
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/stats/executive
// @desc    Get executive dashboard stats
// @access  Private (Executive)
router.get('/executive', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'executive') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const db = getDB();
    
    const pendingPickups = db.pickups.filter(p => p.status === 'pending').length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completedToday = db.pickups.filter(p => 
      p.executiveId === req.user.id && 
      p.status === 'completed' &&
      new Date(p.completedAt) >= today
    ).length;

    const myPickups = db.pickups.filter(p => p.executiveId === req.user.id && p.status === 'completed');
    const totalCollected = myPickups.reduce((sum, p) => sum + (p.actualWeight || 0), 0);

    res.json({
      success: true,
      data: {
        pendingPickups,
        completedToday,
        totalCollected
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/stats/user
// @desc    Get user dashboard stats
// @access  Private (User)
router.get('/user', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const db = getDB();
    
    const user = db.users.find(u => u.id === req.user.id);
    const dustbin = db.dustbins.find(d => d.userId === req.user.id);
    
    const scheduledPickups = db.pickups.filter(p => 
      p.userId === req.user.id && 
      ['pending', 'accepted', 'in-progress'].includes(p.status)
    ).length;

    const recentActivity = db.pickups
      .filter(p => p.userId === req.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        credits: user.credits,
        dustbinLevel: dustbin ? dustbin.level : 0,
        scheduledPickups,
        recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
