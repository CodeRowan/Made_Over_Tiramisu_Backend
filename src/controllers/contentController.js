/**
 * Content Controller
 *
 * Manages homepage content sections:
 * - Get content by section (public)
 * - Update content (admin)
 * - Get all sections (admin)
 *
 * Sections include: hero, about, story, video, testimonials, etc.
 */

import Content from '../models/Content.js';
import ActivityLog from '../models/ActivityLog.js';
import { validate, createContentSchema } from '../utils/validators.js';
import ApiError, { ErrorTypes } from '../utils/errorHandler.js';
import { deleteImage, extractPublicIdFromUrl } from '../services/cloudinaryService.js';
import { emitUpdate } from '../realtime.js';
import logger from '../utils/logger.js';

/**
 * Get content for a specific section
 *
 * GET /api/content/:section
 * Public endpoint (no auth required)
 * Returns: { content }
 */
export const getContentBySection = async (req, res, next) => {
  try {
    const { section } = req.params;

    // Validate section name
    const validSections = [
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
    ];

    if (!validSections.includes(section)) {
      throw ErrorTypes.BAD_REQUEST(`Invalid section: ${section}`);
    }

    let content = await Content.findOne({ section });

    // If no content exists, create default placeholder
    if (!content) {
      content = await Content.create({
        section,
        title: `${section.toUpperCase()} Section`,
        description: 'This section is not configured yet',
      });
    }

    res.status(200).json({
      success: true,
      content,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all content sections
 *
 * GET /api/content
 * Admin endpoint
 * Returns: { content }
 */
export const getAllContent = async (req, res, next) => {
  try {
    const content = await Content.find({}).populate(
      'updatedBy',
      'name email'
    );

    res.status(200).json({
      success: true,
      content,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update content for a section
 *
 * PUT /api/content/:section
 * Admin endpoint
 * Body: { title, subtitle, description, image, videoId }
 * Returns: { content }
 */
export const updateContent = async (req, res, next) => {
  try {
    const { section } = req.params;

    // Validate section name
    const validSections = [
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
    ];

    if (!validSections.includes(section)) {
      throw ErrorTypes.BAD_REQUEST(`Invalid section: ${section}`);
    }

    // Validate input
    const { error, value } = validate(createContentSchema, {
      section,
      ...req.body,
    });

    if (error) {
      throw ErrorTypes.VALIDATION_ERROR('Validation failed', error.details);
    }

    // Find or create content
    let content = await Content.findOne({ section });

    if (!content) {
      // Create new if doesn't exist
      content = new Content({
        section,
        ...value,
        updatedBy: req.user._id,
      });
    } else {
      // Store old values
      const oldContent = content.toObject();

      // Update content
      Object.assign(content, value);
      content.updatedBy = req.user._id;

      // Delete old image from Cloudinary if new image is provided
      if (
        value.image &&
        oldContent.image &&
        oldContent.image !== value.image
      ) {
        try {
          const publicId = extractPublicIdFromUrl(oldContent.image);
          if (publicId) {
            await deleteImage(publicId);
          }
        } catch (imageError) {
          logger.warn({ err: imageError }, 'Failed to delete old image');
        }
      }

      // Create change summary
      const changes = [];
      Object.keys(value).forEach((key) => {
        if (oldContent[key] !== value[key]) {
          changes.push(`${key}: "${oldContent[key]}" → "${value[key]}"`);
        }
      });

      // Log activity
      await ActivityLog.create({
        'admin.id': req.user._id,
        'admin.name': req.user.name,
        'admin.email': req.user.email,
        action: 'edit_content',
        resourceType: 'content',
        resourceId: content._id,
        changesSummary: changes.join(', ') || `Updated ${section} section`,
        oldValue: oldContent,
        newValue: value,
      });
    }

    // Save content
    await content.save();
    await content.populate('updatedBy', 'name email');

    emitUpdate('content');

    res.status(200).json({
      success: true,
      message: `${section} section updated successfully`,
      content,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Initialize all content sections with defaults
 *
 * POST /api/content/init
 * Admin endpoint (super_admin only)
 * Returns: { message }
 */
export const initializeContent = async (req, res, next) => {
  try {
    const sections = [
      {
        section: 'hero',
        title: 'Welcome to Mad Over Tiramisu',
        subtitle: 'Experience the Perfect Blend',
        description:
          'Delicious, handcrafted tiramisu made with love and the finest ingredients.',
      },
      {
        section: 'about',
        title: 'About Our Story',
        description: 'We believe in quality and tradition...',
      },
      {
        section: 'story',
        title: 'Our Journey',
        description: 'It all started with a passion for tiramisu...',
      },
      {
        section: 'video',
        title: 'The Art of the Perfect Spoon',
        description: 'Watch how we create our signature tiramisu',
        videoId: 'dQw4w9WgXcQ',
      },
      {
        section: 'testimonials',
        title: 'What Our Customers Say',
        description: 'Hear from our happy customers',
      },
      {
        section: 'instagram',
        title: 'Follow Us on Instagram',
        description: 'Join our community and see behind the scenes',
      },
      {
        section: 'map',
        title: 'Visit Us',
        description: 'Find us at our location',
      },
      {
        section: 'contact',
        title: 'Get in Touch',
        description: 'We love hearing from our customers',
      },
      {
        section: 'footer',
        title: 'Mad Over Tiramisu',
        subtitle: 'AUSTRALIA',
        description:
          'One recipe. Pure obsession. Hand-crafted tiramisu made fresh daily across Gold Coast, Australia.',
        email: 'hello@madovertiramisu.com.au',
        phone: '+61 400 000 001',
        address: 'Hope Island & Emerald Lakes, QLD',
      },
      {
        section: 'general',
        title: 'Site Branding',
      },
    ];

    // Create all sections
    const created = await Promise.all(
      sections.map((sec) =>
        Content.findOneAndUpdate(
          { section: sec.section },
          {
            ...sec,
            updatedBy: req.user._id,
          },
          { upsert: true, new: true }
        )
      )
    );

    emitUpdate('content');

    res.status(201).json({
      success: true,
      message: 'All content sections initialized',
      count: created.length,
    });
  } catch (error) {
    next(error);
  }
};
