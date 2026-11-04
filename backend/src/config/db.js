import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      console.warn('⚠️ MONGODB_URI not found in environment. Connecting to local fallback: mongodb://127.0.0.1:27017/craviti');
    }

    const uri = mongoUri || 'mongodb://127.0.0.1:27017/craviti';
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

