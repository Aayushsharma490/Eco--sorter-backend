import mongoose from 'mongoose';

const dustbinSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: String,
    required: true
  },
  level: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['low', 'moderate', 'critical'],
    default: 'low'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Update status based on level
dustbinSchema.pre('save', function(next) {
  if (this.level >= 80) {
    this.status = 'critical';
  } else if (this.level >= 50) {
    this.status = 'moderate';
  } else {
    this.status = 'low';
  }
  next();
});

const Dustbin = mongoose.model('Dustbin', dustbinSchema);

export default Dustbin;
