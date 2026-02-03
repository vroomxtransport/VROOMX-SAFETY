require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = 'levanisbx@gmail.com';

async function forceUpdate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Use raw updateOne to bypass any Mongoose issues
    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: ADMIN_EMAIL },
      { $set: { isSuperAdmin: true } }
    );

    console.log('Update result:', JSON.stringify(result, null, 2));

    // Verify with raw find
    const user = await mongoose.connection.db.collection('users').findOne({ email: ADMIN_EMAIL });
    console.log('User ID:', user._id.toString());
    console.log('User isSuperAdmin after update:', user.isSuperAdmin);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

forceUpdate();
