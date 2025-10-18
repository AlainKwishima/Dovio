import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    if (process.env.MONGO_USE_MEMORY === 'true') {
      if (!memoryServer) {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
      }
      const uri = memoryServer.getUri();
      await mongoose.connect(uri);
      console.log('MongoDB Connected: in-memory instance');
      return;
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    if (process.env.MONGO_USE_MEMORY_FALLBACK === 'true') {
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const uri = memoryServer.getUri();
        await mongoose.connect(uri);
        console.log('MongoDB Connected: in-memory fallback');
        return;
      } catch (e) {
        console.error('Failed to start in-memory MongoDB fallback:', e.message);
      }
    }
    process.exit(1);
  }
};

let memoryServer = null;
export const connectTestDB = async () => {
  if (memoryServer) return;
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri();
  await mongoose.connect(uri);
};

export const disconnectTestDB = async () => {
  try {
    await mongoose.connection.close();
  } catch {}
  if (memoryServer) {
    try { await memoryServer.stop(); } catch {}
    memoryServer = null;
  }
};

export default connectDB;
