/**
 * Rate Limiting Middleware
 *
 * Throttles the public auth endpoints (login, forgot-password,
 * reset-password) to slow down brute-force and email-enumeration attempts.
 * Uses a MongoDB-backed store (see mongoRateLimitStore.js) so the limit is
 * enforced correctly across Vercel's multiple serverless instances, not just
 * within a single instance's memory.
 */

import rateLimit from 'express-rate-limit';
import MongoRateLimitStore from '../utils/mongoRateLimitStore.js';

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export const authRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please try again in 15 minutes.',
  },
  store: new MongoRateLimitStore(WINDOW_MS),
});
