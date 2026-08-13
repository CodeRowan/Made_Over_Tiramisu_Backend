/**
 * Contact Controller
 *
 * Handles contact form submissions:
 * - Submit contact form (public)
 * - Get all messages (admin)
 * - Mark as read (admin)
 * - Delete message (admin)
 *
 * When a message is submitted, email is sent to owner
 */

import ContactMessage from '../models/ContactMessage.js';
import Owner from '../models/Owner.js';
import { validate, createContactSchema } from '../utils/validators.js';
import ApiError, { ErrorTypes } from '../utils/errorHandler.js';
import { sendContactFormEmail } from '../services/emailService.js';
import { emitUpdate } from '../realtime.js';
import logger from '../utils/logger.js';

/**
 * Submit contact form
 *
 * POST /api/contact
 * Public endpoint (no auth required)
 * Body: { name, email, phone, message }
 * Returns: { message }
 */
export const submitContactForm = async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = validate(createContactSchema, req.body);
    if (error) {
      throw ErrorTypes.VALIDATION_ERROR('Validation failed', error.details);
    }

    const { name, email, phone, message } = value;

    // Get owner email
    const owner = await Owner.findOne();
    if (!owner) {
      throw ErrorTypes.INTERNAL_SERVER_ERROR('Owner information not configured');
    }

    // Create contact message
    const contactMessage = await ContactMessage.create({
      name,
      email,
      phone,
      message,
      emailSent: false,
    });

    // Send email to owner asynchronously (don't wait for it)
    try {
      await sendContactFormEmail(owner.email, {
        name,
        email,
        phone,
        message,
      });

      // Update emailSent status
      contactMessage.emailSent = true;
      await contactMessage.save();
    } catch (emailError) {
      logger.error({ err: emailError }, 'Failed to send contact email');
      // Still save the message, but mark that email failed
      contactMessage.emailError = emailError.message;
      contactMessage.emailSent = false;
      await contactMessage.save();
    }

    emitUpdate('messages');

    res.status(201).json({
      success: true,
      message:
        'Your message has been received. We will get back to you soon!',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all contact messages
 *
 * GET /api/contact
 * Admin endpoint
 * Query params: ?limit=10&skip=0&isRead=false
 * Returns: { messages, total }
 */
export const getAllMessages = async (req, res, next) => {
  try {
    const { limit = 10, skip = 0, isRead } = req.query;

    // Build filter
    const filter = {};
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    // Get total count
    const total = await ContactMessage.countDocuments(filter);

    // Get messages with pagination
    const messages = await ContactMessage.find(filter)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      messages,
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
 * Get single message
 *
 * GET /api/contact/:id
 * Admin endpoint
 * Returns: { message }
 */
export const getMessageById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const message = await ContactMessage.findById(id);

    if (!message) {
      throw ErrorTypes.NOT_FOUND('Message not found');
    }

    // Mark as read
    if (!message.isRead) {
      message.isRead = true;
      await message.save();
    }

    res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark message as read
 *
 * PUT /api/contact/:id/read
 * Admin endpoint
 * Returns: { message }
 */
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const message = await ContactMessage.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!message) {
      throw ErrorTypes.NOT_FOUND('Message not found');
    }

    emitUpdate('messages');

    res.status(200).json({
      success: true,
      message: 'Message marked as read',
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete message
 *
 * DELETE /api/contact/:id
 * Admin endpoint
 * Returns: { message }
 */
export const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const message = await ContactMessage.findByIdAndDelete(id);

    if (!message) {
      throw ErrorTypes.NOT_FOUND('Message not found');
    }

    emitUpdate('messages');

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread messages count
 *
 * GET /api/contact/stats/unread
 * Admin endpoint
 * Returns: { count }
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await ContactMessage.countDocuments({ isRead: false });

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    next(error);
  }
};
