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

// @route   POST /api/location/update
// @desc    Update user/executive location
// @access  Private
router.post('/update', verifyToken, (req, res) => {
  try {
    const { latitude, longitude, pickupId } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const db = getDB();
    
    // Update user location
    const user = db.users.find(u => u.id === req.user.id);
    if (user) {
      user.location = {
        latitude,
        longitude,
        lastUpdated: new Date().toISOString()
      };
    }

    // If pickupId provided, update pickup location
    if (pickupId) {
      const pickup = db.pickups.find(p => p.id === pickupId);
      if (pickup) {
        if (req.user.role === 'executive') {
          pickup.executiveLocation = {
            latitude,
            longitude,
            lastUpdated: new Date().toISOString()
          };
        } else if (req.user.role === 'user') {
          pickup.userLocation = {
            latitude,
            longitude,
            lastUpdated: new Date().toISOString()
          };
        }
      }
    }

    saveDB(db);

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        latitude,
        longitude,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/location/pickup/:id
// @desc    Get location for a specific pickup
// @access  Private
router.get('/pickup/:id', verifyToken, (req, res) => {
  try {
    const db = getDB();
    const pickup = db.pickups.find(p => p.id === req.params.id);

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found'
      });
    }

    // Check authorization
    if (req.user.role === 'user' && pickup.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (req.user.role === 'executive' && pickup.executiveId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Get user and executive details
    const user = db.users.find(u => u.id === pickup.userId);
    const executive = pickup.executiveId ? db.users.find(u => u.id === pickup.executiveId) : null;

    res.json({
      success: true,
      data: {
        pickupId: pickup.id,
        userLocation: pickup.userLocation || user?.location || null,
        executiveLocation: pickup.executiveLocation || executive?.location || null,
        pickupAddress: pickup.address,
        status: pickup.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/location/executive/:id
// @desc    Get executive's current location
// @access  Private
router.get('/executive/:id', verifyToken, (req, res) => {
  try {
    const db = getDB();
    const executive = db.users.find(u => u.id === req.params.id && u.role === 'executive');

    if (!executive) {
      return res.status(404).json({
        success: false,
        message: 'Executive not found'
      });
    }

    res.json({
      success: true,
      data: {
        executiveId: executive.id,
        name: executive.name,
        phone: executive.phone,
        location: executive.location || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
