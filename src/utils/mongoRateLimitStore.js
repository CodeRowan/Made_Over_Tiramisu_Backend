/**
 * MongoDB-backed store for express-rate-limit
 *
 * Implements the express-rate-limit Store interface
 * (https://express-rate-limit.mjr.one/reference/configuration#store) using
 * the RateLimitEntry collection, so request counts are shared across all
 * Vercel serverless instances instead of living in a single instance's
 * process memory.
 *
 * Each key gets one document. increment() uses a single atomic
 * findOneAndUpdate with an aggregation pipeline so concurrent requests for
 * the same key can't race: if the current window has expired, the pipeline
 * resets the count to 1 and starts a new window; otherwise it increments the
 * existing count. Missing fields on first insert compare as "less than" any
 * date in MongoDB's pipeline expressions, so the same branch naturally
 * handles brand-new keys.
 */

import RateLimitEntry from '../models/RateLimitEntry.js';

class MongoRateLimitStore {
  constructor(windowMs) {
    this.windowMs = windowMs;
  }

  // Called by express-rate-limit with the resolved options (includes windowMs).
  init(options) {
    this.windowMs = options.windowMs;
  }

  async increment(key) {
    const now = new Date();
    const resetTime = new Date(now.getTime() + this.windowMs);

    const doc = await RateLimitEntry.findOneAndUpdate(
      { key },
      [
        {
          $set: {
            count: {
              $cond: [{ $lte: ['$expiresAt', now] }, 1, { $add: ['$count', 1] }],
            },
            expiresAt: {
              $cond: [{ $lte: ['$expiresAt', now] }, resetTime, '$expiresAt'],
            },
          },
        },
      ],
      { upsert: true, new: true }
    );

    return { totalHits: doc.count, resetTime: doc.expiresAt };
  }

  async decrement(key) {
    await RateLimitEntry.updateOne({ key }, { $inc: { count: -1 } });
  }

  async resetKey(key) {
    await RateLimitEntry.deleteOne({ key });
  }

  async resetAll() {
    await RateLimitEntry.deleteMany({});
  }
}

export default MongoRateLimitStore;
