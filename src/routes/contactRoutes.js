/**
 * Contact Routes
 *
 * POST /api/contact - Submit contact form (public)
 * GET /api/contact - Get all messages (admin)
 * GET /api/contact/:id - Get single message (admin)
 * GET /api/contact/stats/unread - Get unread count (admin)
 * PUT /api/contact/:id/read - Mark as read (admin)
 * DELETE /api/contact/:id - Delete message (admin)
 */

import express from 'express';
import {
  submitContactForm,
  getAllMessages,
  getMessageById,
  markAsRead,
  deleteMessage,
  getUnreadCount,
} from '../controllers/contactController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route
router.post('/', submitContactForm);

// Admin routes
router.get('/stats/unread', authenticate, getUnreadCount);
router.get('/:id', authenticate, getMessageById);
router.get('/', authenticate, getAllMessages);
router.put('/:id/read', authenticate, markAsRead);
router.delete('/:id', authenticate, deleteMessage);

export default router;
