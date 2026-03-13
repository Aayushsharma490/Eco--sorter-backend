import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import CollectionCenter from './models/CollectionCenter.js';
import Dustbin from './models/Dustbin.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecosorter');
    console.log('✅ MongoDB Connected');

    // Clear existing data
    await User.deleteMany();
    await CollectionCenter.deleteMany();
    await Dustbin.deleteMany();
    console.log('🗑️  Cleared existing data');

    // Create demo users
    const demoUser = await User.create({
      name: 'Demo User',
      email: 'user@demo.com',
      password: 'demo123',
      role: 'user',
      phone: '+91 123 456 7890',
      address: {
        street: 'Sector 5',
        city: 'Udaipur',
        state: 'Rajasthan',
        pincode: '313001'
      },
      credits: 450
    });

    const demoExecutive = await User.create({
      name: 'Demo Executive',
      email: 'executive@demo.com',
      password: 'demo123',
      role: 'executive',
      phone: '+91 987 654 3210'
    });

    const demoAdmin = await User.create({
      name: 'Demo Admin',
      email: 'admin@demo.com',
      password: 'demo123',
      role: 'admin',
      phone: '+91 555 666 7777'
    });

    console.log('👥 Created demo users');

    // Create dustbin for demo user
    await Dustbin.create({
      user: demoUser._id,
      location: 'Sector 5, Udaipur',
      level: 65
    });

    console.log('🗑️  Created dustbin');

    // Create collection centers
    await CollectionCenter.create([
      {
        name: 'Apno Bhandhar',
        address: {
          fullAddress: '115 and 116 Amba Mata ki Ghati Mangal Vihar Titardi, Teshil Girwa, Udaipur, Rajasthan, IN'
        },
        serviceableAreas: [
          { areaName: 'Area 1', pincode: '313100' },
          { areaName: 'Area 2', pincode: '313101' },
          { areaName: 'Area 3', pincode: '313103' }
        ],
        contact: {
          phone: '+91 123 456 7890',
          email: 'apnobhandhar@example.com'
        }
      },
      {
        name: 'Trust of People',
        address: {
          fullAddress: 'Jagatpura, Jaipur, Rajasthan, IN'
        },
        serviceableAreas: [
          { areaName: 'Area 8', pincode: '313000' },
          { areaName: 'Area 9', pincode: '313008' },
          { areaName: 'Area 7', pincode: '313031' },
          { areaName: 'Area', pincode: '313024' },
          { areaName: 'Area 1', pincode: '313001' },
          { areaName: 'Area 2', pincode: '313002' },
          { areaName: 'Area 3', pincode: '313003' },
          { areaName: 'Area 4', pincode: '313004' },
          { areaName: 'Area 5', pincode: '313011' },
          { areaName: 'Area 6', pincode: '313022' },
          { areaName: 'Area 10', pincode: '313009' }
        ],
        contact: {
          phone: '+91 987 654 3210',
          email: 'trustofpeople@example.com'
        }
      }
    ]);

    console.log('🏢 Created collection centers');

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📝 Demo Credentials:');
    console.log('User: user@demo.com / demo123');
    console.log('Executive: executive@demo.com / demo123');
    console.log('Admin: admin@demo.com / demo123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error);
    process.exit(1);
  }
};

seedData();
