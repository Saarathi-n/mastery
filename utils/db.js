
import mongoose from 'mongoose';
import config from '../config/index.js';

export async function connectDB() {
  try {
    const conn = await mongoose.connect(config.mongo.uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

export default connectDB;

