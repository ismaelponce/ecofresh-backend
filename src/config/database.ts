import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const { MONGODB_URI, MONGODB_DB_NAME } = process.env;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables');
}

export const connectDB = async (): Promise<void> => {
  try {
    mongoose.set('debug', process.env.NODE_ENV === 'development');
    
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME || 'ecofresh'
    });
    
    console.log('MongoDB Connected Successfully');
    
    // Log when the connection is lost
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}; 