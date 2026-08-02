/**
 * Owner Model
 *
 * Stores the business owner's information.
 * This is where the owner's email is stored for receiving contact form messages.
 *
 * Note: Typically there's only ONE owner document in this collection.
 */

import mongoose from 'mongoose';

const ownerSchema = new mongoose.Schema(
  {
    // Owner's full name
    name: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
    },

    // Business name (e.g., "Mad Over Tiramisu")
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
    },

    // Owner's email - receives contact form messages
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },

    // Owner's phone number
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },

    // Business address
    address: {
      type: String,
      trim: true,
      default: null,
    },

    // City
    city: {
      type: String,
      trim: true,
      default: null,
    },

    // State/Province
    state: {
      type: String,
      trim: true,
      default: null,
    },

    // Country
    country: {
      type: String,
      trim: true,
      default: null,
    },

    // Postal code
    postalCode: {
      type: String,
      trim: true,
      default: null,
    },

    // Whether the owner profile is active
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Prevent multiple owner documents
 * Only one owner should exist (we'll enforce this in the controller)
 */
ownerSchema.index({ email: 1 }, { unique: true });

const Owner = mongoose.model('Owner', ownerSchema);

export default Owner;
