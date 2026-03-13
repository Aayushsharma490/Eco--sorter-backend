import mongoose from 'mongoose';

const pickupSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  executive: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Please provide a pickup date']
  },
  estimatedWeight: {
    type: Number,
    required: [true, 'Please provide estimated weight'],
    min: 5
  },
  actualWeight: {
    type: Number
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  creditsEarned: {
    type: Number,
    default: 0
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
});

// Calculate credits when pickup is completed
pickupSchema.pre('save', function(next) {
  if (this.status === 'completed' && this.actualWeight && !this.creditsEarned) {
    // 1kg = 10 credits
    this.creditsEarned = Math.floor(this.actualWeight * 10);
  }
  next();
});

const Pickup = mongoose.model('Pickup', pickupSchema);

export default Pickup;
