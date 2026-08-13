/**
 * Product Controller
 *
 * Handles product management:
 * - Get all products (public - for landing page)
 * - Create product (admin)
 * - Update product (admin)
 * - Delete product (admin)
 *
 * All admin operations are logged in ActivityLog
 */

import Product from '../models/Product.js';
import ActivityLog from '../models/ActivityLog.js';
import { validate, createProductSchema, updateProductSchema } from '../utils/validators.js';
import ApiError, { ErrorTypes } from '../utils/errorHandler.js';
import { deleteImage, extractPublicIdFromUrl } from '../services/cloudinaryService.js';
import { emitUpdate } from '../realtime.js';
import logger from '../utils/logger.js';

/**
 * Get all products
 *
 * GET /api/products
 * Query params: ?category=classic&limit=10&skip=0
 * Returns: { products, total }
 */
export const getAllProducts = async (req, res, next) => {
  try {
    const { category, limit = 10, skip = 0 } = req.query;

    // Public requests only see available products; an authenticated admin
    // (attached by optionalAuthenticate) sees everything for management
    const filter = req.user ? {} : { isAvailable: true };
    if (category) {
      filter.category = category;
    }

    // Get total count
    const total = await Product.countDocuments(filter);

    // Get products with pagination
    const products = await Product.find(filter)
      .populate('createdBy', 'name email')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      products,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single product by ID
 *
 * GET /api/products/:id
 * Returns: { product }
 */
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate('createdBy', 'name email');

    if (!product) {
      throw ErrorTypes.NOT_FOUND('Product not found');
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new product
 *
 * POST /api/products
 * Body: { name, price, description, image, category, isAvailable }
 * Requires: Admin authentication
 * Returns: { product }
 */
export const createProduct = async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = validate(createProductSchema, req.body);
    if (error) {
      throw ErrorTypes.VALIDATION_ERROR('Validation failed', error.details);
    }

    const { name, price, description, image, category, isAvailable } = value;

    // Create product
    const product = await Product.create({
      name,
      price,
      description,
      image,
      category,
      isAvailable,
      createdBy: req.user._id,
    });

    // Populate creator info
    await product.populate('createdBy', 'name email');

    // Log activity
    await ActivityLog.create({
      'admin.id': req.user._id,
      'admin.name': req.user.name,
      'admin.email': req.user.email,
      action: 'create_product',
      resourceType: 'product',
      resourceId: product._id,
      changesSummary: `Created new product: ${name} ($${price})`,
      newValue: product.toObject(),
    });

    emitUpdate('products');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update product
 *
 * PUT /api/products/:id
 * Body: { name, price, description, image, category, isAvailable }
 * Requires: Admin authentication
 * Returns: { product }
 */
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate input
    const { error, value } = validate(updateProductSchema, req.body);
    if (error) {
      throw ErrorTypes.VALIDATION_ERROR('Validation failed', error.details);
    }

    // Find product
    const product = await Product.findById(id);
    if (!product) {
      throw ErrorTypes.NOT_FOUND('Product not found');
    }

    // Store old values for audit log
    const oldProduct = product.toObject();

    // Update fields
    Object.assign(product, value);
    await product.save();

    await product.populate('createdBy', 'name email');

    // Create change summary
    const changes = [];
    Object.keys(value).forEach((key) => {
      if (oldProduct[key] !== product[key]) {
        changes.push(`${key}: ${oldProduct[key]} → ${product[key]}`);
      }
    });

    // Log activity
    await ActivityLog.create({
      'admin.id': req.user._id,
      'admin.name': req.user.name,
      'admin.email': req.user.email,
      action: 'edit_product',
      resourceType: 'product',
      resourceId: product._id,
      changesSummary: changes.join(', ') || 'Product updated',
      oldValue: oldProduct,
      newValue: product.toObject(),
    });

    emitUpdate('products');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete product
 *
 * DELETE /api/products/:id
 * Requires: Admin authentication
 * Returns: { message }
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find product
    const product = await Product.findById(id);
    if (!product) {
      throw ErrorTypes.NOT_FOUND('Product not found');
    }

    const productData = product.toObject();

    // Delete image from Cloudinary if it exists
    if (product.image) {
      try {
        const publicId = extractPublicIdFromUrl(product.image);
        if (publicId) {
          await deleteImage(publicId);
        }
      } catch (imageError) {
        logger.warn({ err: imageError }, 'Failed to delete image from Cloudinary');
        // Don't fail the product deletion if image deletion fails
      }
    }

    // Delete product
    await Product.findByIdAndDelete(id);

    // Log activity
    await ActivityLog.create({
      'admin.id': req.user._id,
      'admin.name': req.user.name,
      'admin.email': req.user.email,
      action: 'delete_product',
      resourceType: 'product',
      resourceId: id,
      changesSummary: `Deleted product: ${product.name}`,
      oldValue: productData,
    });

    emitUpdate('products');

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search products
 *
 * GET /api/products/search?q=tiramisu
 * Returns: { products }
 */
export const searchProducts = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      throw ErrorTypes.BAD_REQUEST('Search query must be at least 2 characters');
    }

    // Use MongoDB text search
    const products = await Product.find(
      {
        $text: { $search: q },
        isAvailable: true,
      },
      {
        score: { $meta: 'textScore' },
      }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(10);

    res.status(200).json({
      success: true,
      products,
      count: products.length,
    });
  } catch (error) {
    next(error);
  }
};
