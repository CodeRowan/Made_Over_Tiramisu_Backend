/**
 * Instagram Post Model
 *
 * Represents a single post shown in the Instagram feed section.
 *
 * Fields:
 * - image: Image URL (Cloudinary)
 * - caption: Optional caption
 * - link: Optional link to the real Instagram post
 * - likes: Like count to display
 * - comments: Comment count to display
 * - order: Manual sort order (lower shows first)
 * - isActive: Whether the post is shown on the public site
 * - createdBy: Which admin created this post
 */

import mongoose from 'mongoose';

const instagramPostSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: [true, 'Image is required'],
    },

    caption: {
      type: String,
      maxlength: [300, 'Caption cannot exceed 300 characters'],
    },

    link: {
      type: String,
      default: null,
    },

    likes: {
      type: Number,
      min: 0,
      default: 0,
    },

    comments: {
      type: Number,
      min: 0,
      default: 0,
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

instagramPostSchema.index({ isActive: 1, order: 1 });

const InstagramPost = mongoose.model('InstagramPost', instagramPostSchema);

export default InstagramPost;
