import mongoose from 'mongoose';
import logger from '../utils/logger';
import dotenv from 'dotenv';
dotenv.config();
console.log(process.env.MONGO_URI)
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/vidyamritdb";

export const connectDB = async () => {
    try {
        await mongoose.connect(mongoUri, {
        });
        logger.info('Connected to MongoDB');
    } catch (err) {
        logger.error('MongoDB connection error:', err);
        process.exit(1);
    }
};
