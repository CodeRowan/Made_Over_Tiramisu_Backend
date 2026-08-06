/**
 * Input Validation Utilities
 *
 * These functions validate user input before processing.
 *
 * Why validate?
 * - Prevent invalid data from entering the database
 * - Protect against injection attacks
 * - Provide clear error messages to users
 * - Improve data quality
 *
 * We use Joi library for schema validation
 * It's simple, powerful, and widely used
 */

import Joi from 'joi';

/**
 * Per-section character limits for Content fields.
 *
 * These mirror frontend/src/constants/fieldLimits.ts exactly — tuned to what
 * the real page layout can hold on phone and desktop without wrapping into
 * extra lines or breaking a fixed-height section. Enforced here too (not
 * just in the admin UI) so a direct API call can't bypass what the UI
 * prevents.
 */
const CONTENT_FIELD_LIMITS = {
  hero: { title: 50, subtitle: 90, description: 160 },
  about: { title: 50, subtitle: 60, description: 900 },
  story: { title: 50, subtitle: 70, description: 900 },
  video: { title: 60, description: 140 },
  testimonials: { title: 60, description: 140 },
  instagram: { title: 30, description: 200 },
  map: { title: 60, description: 140 },
  contact: { title: 60, description: 300 },
  footer: { title: 40, subtitle: 20, description: 160, address: 100, email: 100, phone: 30 },
};

/**
 * Common regex patterns
 */
const PATTERNS = {
  // YouTube video ID: 11 characters, letters, numbers, underscore, hyphen
  YOUTUBE_ID: /^[a-zA-Z0-9_-]{11}$/,

  // Email validation
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Strong password: min 6 chars, at least 1 number and 1 letter
  STRONG_PASSWORD: /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/,

  // URL validation
  URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
};

/**
 * Validation Schemas using Joi
 * These define what data is expected for each operation
 */

// Login validation
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

// Register/Create user validation
export const createUserSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
  name: Joi.string().required().messages({
    'any.required': 'Name is required',
  }),
  role: Joi.string().valid('super_admin', 'editor').default('editor'),
});

// Change password validation
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'New password must be at least 6 characters',
    'any.required': 'New password is required',
  }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Confirm password is required',
    }),
});

// Reset password validation
export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required',
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'New password is required',
  }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Confirm password is required',
    }),
});

// Forgot password validation
export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required',
  }),
});

// Create product validation
export const createProductSchema = Joi.object({
  name: Joi.string().max(60).required().messages({
    'string.max': 'Product name cannot exceed 60 characters',
    'any.required': 'Product name is required',
  }),
  price: Joi.number().min(0).required().messages({
    'number.min': 'Price cannot be negative',
    'any.required': 'Price is required',
  }),
  description: Joi.string().max(200).required().messages({
    'string.max': 'Description cannot exceed 200 characters',
    'any.required': 'Description is required',
  }),
  image: Joi.string().required().messages({
    'any.required': 'Image is required',
  }),
  category: Joi.string()
    .valid('classic', 'variation', 'special', 'seasonal')
    .default('classic'),
  isAvailable: Joi.boolean().default(true),
});

// Update product validation (all fields optional)
export const updateProductSchema = Joi.object({
  name: Joi.string().max(60),
  price: Joi.number().min(0),
  description: Joi.string().max(200),
  image: Joi.string(),
  category: Joi.string().valid(
    'classic',
    'variation',
    'special',
    'seasonal'
  ),
  isAvailable: Joi.boolean(),
});

// Create/Update content validation
export const createContentSchema = Joi.object({
  section: Joi.string()
    .valid(
      'hero',
      'about',
      'story',
      'video',
      'testimonials',
      'instagram',
      'map',
      'contact',
      'footer',
      'general'
    )
    .required()
    .messages({
      'any.required': 'Section is required',
    }),
  title: Joi.string().max(200).required().messages({
    'string.max': 'Title cannot exceed 200 characters',
    'any.required': 'Title is required',
  }),
  subtitle: Joi.string().max(300),
  description: Joi.string().max(2000),
  image: Joi.string().allow(''),
  images: Joi.array().items(Joi.string().allow('')).max(6),
  videoUrl: Joi.string().allow('', null),
  videoId: Joi.string().pattern(PATTERNS.YOUTUBE_ID).allow('', null).messages({
    'string.pattern.base': 'Invalid YouTube video ID',
  }),
  email: Joi.string().email().max(100).allow('').messages({
    'string.email': 'Invalid email format',
  }),
  phone: Joi.string().max(30).allow(''),
  address: Joi.string().max(100).allow(''),
}).custom((value, helpers) => {
  const limits = CONTENT_FIELD_LIMITS[value.section] || {};
  for (const [field, max] of Object.entries(limits)) {
    if (value[field] && value[field].length > max) {
      return helpers.message(
        `${field} cannot exceed ${max} characters for the ${value.section} section`
      );
    }
  }
  return value;
});

// Create testimonial validation
export const createTestimonialSchema = Joi.object({
  name: Joi.string().max(50).required().messages({
    'any.required': 'Customer name is required',
  }),
  location: Joi.string().max(50).allow(''),
  text: Joi.string().max(280).required().messages({
    'any.required': 'Review text is required',
  }),
  rating: Joi.number().min(1).max(5).default(5),
  order: Joi.number().default(0),
  isActive: Joi.boolean().default(true),
});

// Update testimonial validation (all fields optional)
export const updateTestimonialSchema = Joi.object({
  name: Joi.string().max(50),
  location: Joi.string().max(50).allow(''),
  text: Joi.string().max(280),
  rating: Joi.number().min(1).max(5),
  order: Joi.number(),
  isActive: Joi.boolean(),
});

// Create Instagram post validation
export const createInstagramPostSchema = Joi.object({
  image: Joi.string().required().messages({
    'any.required': 'Image is required',
  }),
  caption: Joi.string().max(300).allow(''),
  link: Joi.string().allow(''),
  likes: Joi.number().min(0).default(0),
  comments: Joi.number().min(0).default(0),
  order: Joi.number().default(0),
  isActive: Joi.boolean().default(true),
});

// Update Instagram post validation (all fields optional)
export const updateInstagramPostSchema = Joi.object({
  image: Joi.string(),
  caption: Joi.string().max(300).allow(''),
  link: Joi.string().allow(''),
  likes: Joi.number().min(0),
  comments: Joi.number().min(0),
  order: Joi.number(),
  isActive: Joi.boolean(),
});

// Create location validation
export const createLocationSchema = Joi.object({
  name: Joi.string().max(40).required().messages({
    'any.required': 'Location name is required',
  }),
  address: Joi.string().max(100).required().messages({
    'any.required': 'Address is required',
  }),
  phone: Joi.string().max(30).allow(''),
  email: Joi.string().email().max(100).allow('').messages({
    'string.email': 'Invalid email format',
  }),
  hours: Joi.string().max(60).allow(''),
  mapEmbedUrl: Joi.string().allow(''),
  orderLink: Joi.string().allow(''),
  order: Joi.number().default(0),
  isActive: Joi.boolean().default(true),
});

// Update location validation (all fields optional)
export const updateLocationSchema = Joi.object({
  name: Joi.string().max(40),
  address: Joi.string().max(100),
  phone: Joi.string().max(30).allow(''),
  email: Joi.string().email().max(100).allow(''),
  hours: Joi.string().max(60).allow(''),
  mapEmbedUrl: Joi.string().allow(''),
  orderLink: Joi.string().allow(''),
  order: Joi.number(),
  isActive: Joi.boolean(),
});

// Contact message validation
export const createContactSchema = Joi.object({
  name: Joi.string().required().messages({
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required',
  }),
  phone: Joi.string(),
  message: Joi.string().min(10).max(2000).required().messages({
    'string.min': 'Message must be at least 10 characters',
    'string.max': 'Message cannot exceed 2000 characters',
    'any.required': 'Message is required',
  }),
});

/**
 * Generic validation function
 *
 * @param {object} schema - Joi schema to validate against
 * @param {object} data - Data to validate
 * @returns {object} - { value: validated data, error: validation error if any }
 */
export const validate = (schema, data) => {
  return schema.validate(data, {
    abortEarly: false, // Show all errors, not just the first one
    stripUnknown: true, // Remove unknown fields
  });
};
