import mongoose from 'mongoose';

const collectionCenterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide center name'],
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    fullAddress: String
  },
  serviceableAreas: [{
    areaName: String,
    pincode: String
  }],
  contact: {
    phone: String,
    email: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalCollections: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const CollectionCenter = mongoose.model('CollectionCenter', collectionCenterSchema);

export default CollectionCenter;
