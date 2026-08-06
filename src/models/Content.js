/**
 * Content Model
 *
 * Represents editable content sections on the homepage.
 * Each section can have title, description, image, and video.
 *
 * Sections:
 * - hero: Landing page hero section
 * - about: About section
 * - story: Company story section
 * - video: Video showcase section
 * - testimonials: Customer testimonials
 * - instagram: Instagram feed section
 * - map: Location map section
 * - contact: Contact section
 * - footer: Site footer
 * - general: Site-wide branding (logo)
 */

import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema(
  {
    // Section identifier (must be unique)
    section: {
      type: String,
      required: [true, 'Section name is required'],
      unique: true,
      enum: {
        values: [
          'hero',
          'about',
          'story',
          'video',
          'testimonials',
          'instagram',
          'map',
          'contact',
          'footer',
          'general',
        ],
        message: 'Invalid section name',
      },
    },

    // Main heading for the section
    title: {
      type: String,
      required: [true, 'Title is required'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    // Subtitle (optional)
    subtitle: {
      type: String,
      maxlength: [300, 'Subtitle cannot exceed 300 characters'],
    },

    // Main content/description
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    // Image URL from Cloudinary (sections with exactly one photo: hero, video)
    image: {
      type: String,
      default: null,
    },

    // Multiple image URLs (sections with several photo slots: about's two
    // photos, story's main/inset/gallery photos). Index-based — each
    // section's frontend component knows what each index renders as.
    images: {
      type: [String],
      default: [],
    },

    // YouTube video ID (for video section)
    videoId: {
      type: String,
      default: null,
      // This should be just the ID, e.g., "dQw4w9WgXcQ"
      // Not the full URL
    },

    // Direct video URL (from Cloudinary upload or external video link)
    videoUrl: {
      type: String,
      default: null,
    },

    // Contact email (used by footer/contact sections)
    email: {
      type: String,
      default: null,
    },

    // Contact phone (used by footer/contact sections)
    phone: {
      type: String,
      default: null,
    },

    // Contact address (used by footer section)
    address: {
      type: String,
      default: null,
    },

    // Reference to the admin who last updated
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
contentSchema.index({ section: 1 }, { unique: true });

const Content = mongoose.model('Content', contentSchema);

export default Content;
