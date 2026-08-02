/**
 * Testimonial Model
 *
 * Represents a customer review shown in the Testimonials section.
 *
 * Fields:
 * - name: Customer name
 * - location: Customer location (e.g., "Hope Island, QLD")
 * - text: Review text
 * - rating: Star rating, 1-5
 * - order: Manual sort order (lower shows first)
 * - isActive: Whether the review is shown on the public site
 * - createdBy: Which admin created this review
 */

import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    location: {
      type: String,
      trim: true,
      maxlength: [50, 'Location cannot exceed 50 characters'],
    },

    text: {
      type: String,
      required: [true, 'Review text is required'],
      maxlength: [280, 'Review cannot exceed 280 characters'],
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
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

testimonialSchema.index({ isActive: 1, order: 1 });

const Testimonial = mongoose.model('Testimonial', testimonialSchema);

export default Testimonial;
