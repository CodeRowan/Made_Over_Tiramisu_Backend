/**
 * Activity Log Model
 *
 * Records every action taken by admins in the system.
 * This provides an audit trail for accountability and debugging.
 *
 * Actions tracked:
 * - create_product: When a new product is added
 * - edit_product: When a product is modified
 * - delete_product: When a product is removed
 * - edit_content: When homepage content is changed
 * - change_password: When an admin changes their password
 * - login: When an admin logs in (optional)
 */

import mongoose from 'mongoose';
import { emitUpdate } from '../realtime.js';

const activityLogSchema = new mongoose.Schema(
  {
    // Which admin performed the action
    admin: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: String,
      email: String,
    },

    // What action was performed
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: [
        'create_product',
        'edit_product',
        'delete_product',
        'edit_content',
        'change_password',
        'login',
        'create_admin',
        'password_reset_requested',
        'password_changed',
        'upload_image',
        'create_testimonial',
        'edit_testimonial',
        'delete_testimonial',
        'create_instagram_post',
        'edit_instagram_post',
        'delete_instagram_post',
        'create_location',
        'edit_location',
        'delete_location',
      ],
    },

    // What type of resource was affected
    resourceType: {
      type: String,
      required: true,
      enum: [
        'product',
        'content',
        'user',
        'image',
        'testimonial',
        'instagram_post',
        'location',
      ],
    },

    // ID of the affected resource — a Mongo ObjectId for most resources,
    // but a Cloudinary public ID (a string, e.g. "folder/abc123") for
    // upload_image actions, so this needs to accept either.
    resourceId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // Human-readable summary of what changed
    // Example: "Changed price from $10 to $15"
    changesSummary: {
      type: String,
      required: true,
    },

    // The previous values (before change)
    // Useful for reverting changes if needed
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // The new values (after change)
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // IP address of the admin (for security tracking)
    ipAddress: {
      type: String,
      default: null,
    },

    // User agent (what browser/app was used)
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt
  }
);

/**
 * Indexes for better query performance
 * These help with filtering activity logs by admin, action, or date
 */
activityLogSchema.index({ 'admin.id': 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ resourceType: 1 });
activityLogSchema.index({ createdAt: -1 }); // Sort by newest first

// Broadcast to the admin panel whenever any action gets logged, so the
// Activity Log tab and Dashboard stay live without a manual refresh.
activityLogSchema.post('save', function () {
  emitUpdate('activity');
});

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
