import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDB, saveDB } from '../server.js';

const router = express.Router();

// Middleware to verify token and admin role
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key');
    const db = getDB();
    req.user = db.users.find(u => u.id === decoded.id);
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/', verifyAdmin, (req, res) => {
  try {
    const db = getDB();
    const users = db.users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      credits: u.credits,
      phone: u.phone,
      address: u.address,
      createdAt: u.createdAt
    }));

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private (Admin)
router.get('/stats', verifyAdmin, (req, res) => {
  try {
    const db = getDB();
    
    const totalUsers = db.users.filter(u => u.role === 'user').length;
    const totalExecutives = db.users.filter(u => u.role === 'executive').length;
    const totalAdmins = db.users.filter(u => u.role === 'admin').length;
    const totalCredits = db.users.reduce((sum, u) => sum + (u.credits || 0), 0);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalExecutives,
        totalAdmins,
        totalCredits,
        total: db.users.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/users
// @desc    Create new user
// @access  Private (Admin)
router.post('/', verifyAdmin, async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    const db = getDB();
    
    // Check if user exists
    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: `user${Date.now()}`,
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
      credits: 0,
      phone: phone || '',
      address: address || {},
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    saveDB(db);

    const userResponse = { ...newUser };
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin)
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const { name, email, role, credits, phone, address } = req.body;
    const db = getDB();
    
    const user = db.users.find(u => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (credits !== undefined) user.credits = credits;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    saveDB(db);

    const userResponse = { ...user };
    delete userResponse.password;

    res.json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin)
router.delete('/:id', verifyAdmin, (req, res) => {
  try {
    const db = getDB();
    const userIndex = db.users.findIndex(u => u.id === req.params.id);

    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Don't allow deleting yourself
    if (db.users[userIndex].id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }

    db.users.splice(userIndex, 1);
    saveDB(db);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
