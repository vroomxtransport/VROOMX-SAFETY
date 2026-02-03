require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_EMAIL = 'levanisbx@gmail.com';

async function fixAdminAccess() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: ADMIN_EMAIL });

    if (!user) {
      console.error(`User ${ADMIN_EMAIL} not found!`);
      process.exit(1);
    }

    console.log(`Found user: ${user.email}`);
    console.log(`Current isSuperAdmin: ${user.isSuperAdmin}`);

    if (user.isSuperAdmin) {
      console.log('User already has super admin access.');
    } else {
      user.isSuperAdmin = true;
      await user.save();
      console.log('✅ Successfully granted super admin access!');
    }

    // Verify the change
    const updated = await User.findById(user._id);
    console.log(`Verified isSuperAdmin: ${updated.isSuperAdmin}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixAdminAccess();
