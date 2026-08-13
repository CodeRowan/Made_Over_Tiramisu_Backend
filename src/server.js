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

// Must be the very first import: Sentry.init() needs to run before express,
// mongoose, routes, etc. are loaded. See instrument.js for why.
import { Sentry } from './instrument.js';

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pinoHttp from 'pino-http';
import { createServer } from 'http';

// IMPORTANT: Load environment variables FIRST before importing anything that uses them
dotenv.config();

// Import configuration (after dotenv.config())
import { connectDB } from './config/database.js';
import { verifyCloudinaryConfig } from './config/cloudinary.js';
import { initRealtime } from './realtime.js';
import logger from './utils/logger.js';

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

// Trust Vercel's proxy so req.ip reflects the real client IP (from
// X-Forwarded-For) instead of Vercel's internal address. Required for
// express-rate-limit to key on the correct IP — without this it either
// throttles all users as one client or throws at startup.
app.set('trust proxy', 1);

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

// HTTP request logger - structured, leveled log per request (method, path,
// status, response time, a correlation id) instead of a plain text line
app.use(pinoHttp({ logger }));

// ============================================
// Startup Tasks
// ============================================

/**
 * Initialize the application
 * This function runs when server starts
 */
const initializeApp = async () => {
  try {
    logger.info('Starting Mad Over Tiramisu Backend...');

    // Connect to MongoDB
    await connectDB();

    // Verify Cloudinary configuration
    verifyCloudinaryConfig();

    logger.info({ environment: NODE_ENV }, 'Application initialized');
  } catch (error) {
    logger.error({ err: error }, 'Failed to initialize application');
    Sentry.captureException(error);
    await Sentry.flush(2000);
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
    message: 'Server is running in development',
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

// Reports unexpected (5xx / uncaught) errors to Sentry with full request
// context. Must be registered after routes/notFoundHandler and before the
// app's own error handler below.
Sentry.setupExpressErrorHandler(app, {
  shouldHandleError(error) {
    const statusCode = error.statusCode || error.status || 500;
    return statusCode >= 500;
  },
});

// Global error handler - catches all errors, formats the JSON response
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
      logger.info({ port: PORT, environment: NODE_ENV }, 'Server is running');
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    Sentry.captureException(error);
    await Sentry.flush(2000);
    process.exit(1);
  }
};

// ============================================
// Handle Unhandled Errors
// ============================================

// Handle unhandled promise rejections
process.on('unhandledRejection', async (err) => {
  logger.error({ err }, 'Unhandled Rejection');
  Sentry.captureException(err);
  await Sentry.flush(2000);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (err) => {
  logger.error({ err }, 'Uncaught Exception');
  Sentry.captureException(err);
  await Sentry.flush(2000);
  process.exit(1);
});

// ============================================
// Start the application
// ============================================
startServer();

export default app;
