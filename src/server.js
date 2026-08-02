/**
 * Main Application Server
 *
 * This is the entry point of the backend application.
 *
 * What happens here:
 * 1. Load environment variables from .env file
 * 2. Create Express app
 * 3. Connect to MongoDB
 * 4. Setup middleware (CORS, JSON parsing, logging, etc.)
 * 5. Register API routes
 * 6. Start listening on a port
 *
 * Environment: Read from NODE_ENV (development, production, test)
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { createServer } from 'http';

// IMPORTANT: Load environment variables FIRST before importing anything that uses them
dotenv.config();

// Import configuration (after dotenv.config())
import { connectDB } from './config/database.js';
import { verifyCloudinaryConfig } from './config/cloudinary.js';
import { initRealtime } from './realtime.js';

// Import middleware
import {
  errorHandler,
  notFoundHandler,
} from './middleware/errorMiddleware.js';

// ============================================
// Initialize Express App
// ============================================
const app = express();
const httpServer = createServer(app);
initRealtime(httpServer);
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================
// Global Middleware (runs on every request)
// ============================================

// CORS - Allow requests from frontend
// This prevents "blocked by CORS" errors
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true, // Allow cookies if needed
  })
);

// Body parser - Parse JSON from request body
app.use(express.json({ limit: '10kb' })); // 10kb limit to prevent large payloads

// HTTP request logger
// Shows all incoming requests in console
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));

// ============================================
// Startup Tasks
// ============================================

/**
 * Initialize the application
 * This function runs when server starts
 */
const initializeApp = async () => {
  try {
    console.log('🚀 Starting Mad Over Tiramisu Backend...');

    // Connect to MongoDB
    await connectDB();

    // Verify Cloudinary configuration
    verifyCloudinaryConfig();

    console.log(`✅ Application initialized in ${NODE_ENV} mode`);
  } catch (error) {
    console.error('❌ Failed to initialize application:', error.message);
    process.exit(1);
  }
};

// ============================================
// Health Check Route
// ============================================
// This route can be used to check if the server is running
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// ============================================
// Import Routes
// ============================================
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import activityLogRoutes from './routes/activityLogRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import testimonialRoutes from './routes/testimonialRoutes.js';
import instagramRoutes from './routes/instagramRoutes.js';
import locationRoutes from './routes/locationRoutes.js';

// ============================================
// Register API Routes
// ============================================

// Auth routes - Login, register, password reset
app.use('/api/auth', authRoutes);

// Product routes - CRUD operations for products
app.use('/api/products', productRoutes);

// Content routes - Homepage content management
app.use('/api/content', contentRoutes);

// Contact routes - Contact form submissions
app.use('/api/contact', contactRoutes);

// Activity log routes - Audit trail
app.use('/api/activity-log', activityLogRoutes);

// Upload routes - Image uploads to Cloudinary
app.use('/api/upload', uploadRoutes);

// Testimonial routes - Customer reviews shown on the landing page
app.use('/api/testimonials', testimonialRoutes);

// Instagram routes - Instagram feed grid shown on the landing page
app.use('/api/instagram', instagramRoutes);

// Location routes - Store locations shown in the "Find Us" section
app.use('/api/locations', locationRoutes);

// ============================================
// Error Handling (must be last)
// ============================================

// 404 handler - catches undefined routes
app.use(notFoundHandler);

// Global error handler - catches all errors
app.use(errorHandler);

// ============================================
// Start Server
// ============================================

/**
 * Start the Express server
 * Listen on the specified port
 */
const startServer = async () => {
  try {
    // Initialize the app first
    await initializeApp();

    // Start listening (on the http server, not app directly, so Socket.IO
    // can share the same port)
    httpServer.listen(PORT, () => {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`✨ Server is running on port ${PORT}`);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
      console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
      console.log(`${'='.repeat(50)}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// ============================================
// Handle Unhandled Errors
// ============================================

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// ============================================
// Start the application
// ============================================
startServer();

module.exports = app;
