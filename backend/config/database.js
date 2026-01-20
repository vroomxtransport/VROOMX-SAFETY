const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

    // Use in-memory MongoDB for development if no MongoDB is available
    if (process.env.USE_MEMORY_DB === 'true' || !uri || uri.includes('localhost')) {
      try {
        // Try connecting to the provided URI first
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
        console.log(`MongoDB Connected: ${mongoose.connection.host}`);
        return;
      } catch (localError) {
        console.log('Local MongoDB not available, starting in-memory database...');
        mongod = await MongoMemoryServer.create();
        uri = mongod.getUri();
      }
    }

    const conn = await mongoose.connect(uri, {
      // MongoDB connection options
    });

    console.log(`MongoDB Connected: ${conn.connection.host}${mongod ? ' (in-memory)' : ''}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      if (mongod) {
        await mongod.stop();
      }
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
