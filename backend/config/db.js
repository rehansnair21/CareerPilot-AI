import mongoose from 'mongoose';
import dns from 'dns';
import { seedDefaultUsers } from './seed.js';

// Safe DNS setup for MongoDB Atlas SRV resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore DNS set errors
}

const connectDB = async () => {
  const atlasSrvUri = process.env.MONGODB_URI;
  const localUri = 'mongodb://127.0.0.1:27017/careerpilot_ai';

  const urisToTry = [
    { name: 'MongoDB Cloud Atlas (MONGODB_URI)', uri: atlasSrvUri },
    { name: 'Local MongoDB (127.0.0.1:27017)', uri: localUri },
  ].filter((item) => Boolean(item.uri));

  for (const { name, uri } of urisToTry) {
    try {
      const options = {
        serverSelectionTimeoutMS: 3000,
      };
      // Only attach TLS options if connecting to mongodb+srv or ssl URI
      if (uri.includes('mongodb+srv://') || uri.includes('ssl=true') || uri.includes('tls=true')) {
        options.tls = true;
        options.tlsAllowInvalidCertificates = true;
      }
      const conn = await mongoose.connect(uri, options);
      console.log(`[MongoDB Connected Successfully] via ${name}`);
      console.log(`Connected Database Name: ${conn.connection.name}`);
      console.log(`Connected Host: ${conn.connection.host}`);
      await seedDefaultUsers();
      return conn;
    } catch (err) {
      console.warn(`[MongoDB Notice]: Connection via ${name} bypassed: ${err.message || 'Unavailable'}`);
    }
  }

  // Fallback: Start MongoMemoryServer so registration & login always work 100% seamlessly offline
  try {
    console.log('[MongoDB Notice]: Primary database connection unavailable. Starting in-memory MongoDB fallback server...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    const memoryUri = mongoServer.getUri();
    const conn = await mongoose.connect(memoryUri);
    console.log(`[MongoDB Connected Successfully] via MongoMemoryServer (In-Memory Fallback)`);
    console.log(`Connected Host: ${conn.connection.host}`);
    await seedDefaultUsers();
    return conn;
  } catch (memErr) {
    console.error('[MongoDB Critical Error]: Failed to start in-memory MongoDB server:', memErr.message);
  }
};

export default connectDB;



