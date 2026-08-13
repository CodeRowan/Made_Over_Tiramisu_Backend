/**
 * Rate Limit Entry Model
 *
 * Backs the express-rate-limit store for auth routes (login, forgot-password,
 * reset-password). A plain in-memory store doesn't work on Vercel: each
 * serverless invocation can run in a different instance with its own memory,
 * so counts would reset or split across instances. Storing counts in MongoDB
 * (which the app already connects to) gives a shared counter across instances.
 *
 * One document per rate-limit key (e.g. "auth:<ip>"). expiresAt marks the end
 * of the current window; the TTL index cleans up old entries automatically.
 */

import mongoose from 'mongoose';

const rateLimitEntrySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  count: {
    type: Number,
    required: true,
    default: 0,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

// TTL index: MongoDB removes the document once expiresAt has passed.
rateLimitEntrySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RateLimitEntry = mongoose.model('RateLimitEntry', rateLimitEntrySchema);

export default RateLimitEntry;
