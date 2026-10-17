import mongoose from 'mongoose';
import { seedDefaultUsers } from './seed.js';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('[MongoDB FATAL]: MONGODB_URI environment variable is not set. Production requires a valid MongoDB Atlas connection string.');
    process.exit(1);
  }

  try {
    // Connect directly to MongoDB Atlas using standard TLS certificate validation.
    // Strict TLS validation is enforced; invalid certificates and insecure fallbacks are prohibited.
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[MongoDB Connected]: ${conn.connection.host} — database: ${conn.connection.name}`);
    await seedDefaultUsers();
    return conn;
  } catch (err) {
    console.error(`[MongoDB FATAL]: Could not connect to MongoDB Atlas: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
