/**
 * Product Model
 *
 * Represents a tiramisu product that users can purchase.
 *
 * Fields:
 * - name: Product name (e.g., "Classic Tiramisu")
 * - price: Product price in USD
 * - description: Product description
 * - image: Image URL from Cloudinary
 * - category: Product category (e.g., "classic", "variation")
 * - isAvailable: Whether product is currently available
 * - createdBy: Which admin created this product
 * - updatedAt: For tracking changes
 */

import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    // Product name
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [60, 'Product name cannot exceed 60 characters'],
    },

    // Product price in USD
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },

    // Product description
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },

    // Product image URL (stored on Cloudinary)
    image: {
      type: String,
      required: [true, 'Product image is required'],
    },

    // Product category for organization
    category: {
      type: String,
      enum: {
        values: ['classic', 'variation', 'special', 'seasonal'],
        message: 'Invalid category',
      },
      default: 'classic',
    },

    // Availability status
    isAvailable: {
      type: Boolean,
      default: true,
    },

    // Reference to the admin who created this product
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

/**
 * Indexes for better query performance
 */
productSchema.index({ name: 'text', description: 'text' }); // Full-text search
productSchema.index({ category: 1 });
productSchema.index({ isAvailable: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
