import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import pickupRoutes from './routes/pickups.js';
import dustbinRoutes from './routes/dustbins.js';
import centerRoutes from './routes/centers.js';
import statsRoutes from './routes/stats.js';
import locationRoutes from './routes/location.js';
import userRoutes from './routes/users.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load JSON database
export const getDB = () => {
  const dbPath = path.join(__dirname, 'data', 'db.json');
  const data = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(data);
};

export const saveDB = (data) => {
  const dbPath = path.join(__dirname, 'data', 'db.json');
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

console.log('✅ JSON Database Loaded');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/dustbins', dustbinRoutes);
app.use('/api/centers', centerRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Eco Sorter API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
});
