/**
 * Activity Log Routes
 *
 * GET /api/activity-log - Get all logs (admin)
 * GET /api/activity-log/:id - Get single log (admin)
 * GET /api/activity-log/admin/:adminId - Get logs by admin (admin)
 * GET /api/activity-log/resource/:resourceId - Get logs by resource (admin)
 * GET /api/activity-log/stats/summary - Get statistics (admin)
 * DELETE /api/activity-log/cleanup - Delete old logs (super_admin)
 */

import express from 'express';
import {
  getActivityLogs,
  getLogById,
  getAdminActivityLogs,
  getResourceActivityLogs,
  getActivityStats,
  cleanupOldLogs,
} from '../controllers/activityLogController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);

// Get logs
router.get('/stats/summary', getActivityStats);
router.get('/admin/:adminId', getAdminActivityLogs);
router.get('/resource/:resourceId', getResourceActivityLogs);
router.get('/:id', getLogById);
router.get('/', getActivityLogs);

// Cleanup (super_admin only)
router.delete('/cleanup', authorize('super_admin'), cleanupOldLogs);

export default router;
