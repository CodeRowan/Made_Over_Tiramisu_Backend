/**
 * Password Reset Token Model
 *
 * When an admin forgets their password, they request a reset.
 * This model stores temporary tokens that allow them to reset their password.
 *
 * Security features:
 * - Tokens expire after 1 hour
 * - Each token can only be used once
 * - Tokens are unique and randomly generated
 */

import mongoose from 'mongoose';

const passwordResetTokenSchema = new mongoose.Schema(
  {
    // Reference to the user requesting password reset
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // The reset token (randomly generated, unique)
    // This is what's sent to the user's email
    token: {
      type: String,
      required: true,
      unique: true,
    },

    // When this token will expire
    // Set to 1 hour from creation
    expiresAt: {
      type: Date,
      required: true,
    },

    // Whether this token has been used
    // Once used, it cannot be used again
    used: {
      type: Boolean,
      default: false,
    },

    // When the token was used (if at all)
    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Indexes for better query performance
 */
passwordResetTokenSchema.index({ token: 1 });
passwordResetTokenSchema.index({ userId: 1 });
passwordResetTokenSchema.index({ expiresAt: 1 });

/**
 * Automatically delete expired tokens after 1 hour
 * This keeps the database clean
 * TTL (Time To Live) index automatically removes documents when expiresAt time is reached
 */
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordResetToken = mongoose.model(
  'PasswordResetToken',
  passwordResetTokenSchema
);

export default PasswordResetToken;
