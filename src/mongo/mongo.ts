import * as mongoose from 'mongoose';
import { Logger } from '@nestjs/common';

const logger = new Logger('MongoDB');

export async function connectMongo() {
  try {
    // Get connection string from environment variable
    const connectionString = process.env.MONGODB_URI;

    if (!connectionString) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    logger.log('Connecting to MongoDB...');
    await mongoose.connect(connectionString);
    logger.log('Successfully connected to MongoDB');
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    logger.error(`Failed to connect to MongoDB: ${error.message}`);
    throw error;
  }
}
