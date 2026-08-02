/**
 * Database Configuration
 *
 * This file handles the MongoDB connection.
 * It uses Mongoose as the ODM (Object Document Mapper) to interact with MongoDB.
 *
 * Why Mongoose?
 * - Provides schema validation
 * - Handles relationships between collections
 * - Built-in middleware and hooks
 * - Type safety with embedded documentation
 */

import mongoose from 'mongoose';

/**
 * Connect to MongoDB Atlas
 *
 * This function:
 * 1. Takes the MongoDB URI from environment variables
 * 2. Connects to the database
 * 3. Handles connection errors gracefully
 * 4. Logs success/failure messages
 *
 * @returns {Promise} - Resolves when connection is successful
 */
export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    // Check if URI is provided
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, {
      // Connection options for better stability
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`);

    // Exit process with failure code
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 * Useful for graceful shutdowns and testing
 */
export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB Disconnected');
  } catch (error) {
    console.error(`❌ Disconnect Error: ${error.message}`);
    process.exit(1);
  }
};
