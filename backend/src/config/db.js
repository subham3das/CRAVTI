import mongoose from 'mongoose';
import env from './env.js';

export const connectDB = async () => {
  try {
    const uri = env.MONGO_URI;

    const conn = await mongoose.connect(uri, {
      dbName: 'craviti',
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host} [DB: ${conn.connection.name}]`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};
