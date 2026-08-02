/**
 * Location Model
 *
 * Represents a physical store location shown in the "Find Us" map section.
 *
 * Fields:
 * - name: Location name (e.g., "Hope Island")
 * - address: Street address
 * - phone: Contact phone for this location
 * - email: Contact email for this location
 * - hours: Opening hours text
 * - mapEmbedUrl: Google Maps embed URL (the "src" of the embed iframe)
 * - orderLink: External ordering link for this location (UberEats, DoorDash,
 *   a Google Form, WhatsApp, etc. — any URL). "Order Now" opens this on the
 *   public site; shown as "Coming soon" until set.
 * - order: Manual sort order (lower shows first)
 * - isActive: Whether the location is shown on the public site
 * - createdBy: Which admin created this location
 */

import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
      maxlength: [40, 'Name cannot exceed 40 characters'],
    },

    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [100, 'Address cannot exceed 100 characters'],
    },

    phone: {
      type: String,
      trim: true,
      maxlength: [30, 'Phone cannot exceed 30 characters'],
    },

    email: {
      type: String,
      trim: true,
      maxlength: [100, 'Email cannot exceed 100 characters'],
    },

    hours: {
      type: String,
      trim: true,
      maxlength: [60, 'Hours cannot exceed 60 characters'],
    },

    mapEmbedUrl: {
      type: String,
      default: null,
    },

    orderLink: {
      type: String,
      default: null,
    },

    order: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

locationSchema.index({ isActive: 1, order: 1 });

const Location = mongoose.model('Location', locationSchema);

export default Location;
