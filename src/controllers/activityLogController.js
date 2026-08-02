/**
 * Activity Log Controller
 *
 * Retrieves and displays activity logs.
 * Used to show admins what changes have been made and by whom.
 *
 * This provides an audit trail for accountability and debugging.
 */

import ActivityLog from '../models/ActivityLog.js';
import ApiError, { ErrorTypes } from '../utils/errorHandler.js';

/**
 * Get all activity logs
 *
 * GET /api/activity-log
 * Admin endpoint
 * Query params: ?limit=20&skip=0&action=edit_product&adminId=...
 * Returns: { logs, pagination }
 */
export const getActivityLogs = async (req, res, next) => {
  try {
    const { limit = 20, skip = 0, action, adminId, resourceType } = req.query;

    // Build filter
    const filter = {};
    if (action) {
      filter.action = action;
    }
    if (adminId) {
      filter['admin.id'] = adminId;
    }
    if (resourceType) {
      filter.resourceType = resourceType;
    }

    // Get total count
    const total = await ActivityLog.countDocuments(filter);

    // Get logs with pagination, sorted by newest first
    const logs = await ActivityLog.find(filter)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      logs,
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
 * Get activity log by ID
 *
 * GET /api/activity-log/:id
 * Admin endpoint
 * Returns: { log }
 */
export const getLogById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const log = await ActivityLog.findById(id);

    if (!log) {
      throw ErrorTypes.NOT_FOUND('Activity log not found');
    }

    res.status(200).json({
      success: true,
      log,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get logs for a specific admin
 *
 * GET /api/activity-log/admin/:adminId
 * Admin endpoint
 * Query params: ?limit=20&skip=0
 * Returns: { logs, pagination }
 */
export const getAdminActivityLogs = async (req, res, next) => {
  try {
    const { adminId } = req.params;
    const { limit = 20, skip = 0 } = req.query;

    // Get total count
    const total = await ActivityLog.countDocuments({ 'admin.id': adminId });

    // Get logs
    const logs = await ActivityLog.find({ 'admin.id': adminId })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      logs,
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
 * Get activity logs for a specific resource (product, content, etc)
 *
 * GET /api/activity-log/resource/:resourceId
 * Admin endpoint
 * Returns: { logs }
 */
export const getResourceActivityLogs = async (req, res, next) => {
  try {
    const { resourceId } = req.params;

    // Get all logs for this resource, sorted by date
    const logs = await ActivityLog.find({ resourceId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get activity summary statistics
 *
 * GET /api/activity-log/stats/summary
 * Admin endpoint
 * Returns: { stats }
 */
export const getActivityStats = async (req, res, next) => {
  try {
    // Get counts by action
    const actionStats = await ActivityLog.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get counts by admin
    const adminStats = await ActivityLog.aggregate([
      {
        $group: {
          _id: '$admin.email',
          name: { $first: '$admin.name' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentCount = await ActivityLog.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Get total count
    const totalCount = await ActivityLog.countDocuments();

    res.status(200).json({
      success: true,
      stats: {
        byAction: actionStats,
        byAdmin: adminStats,
        totalLogs: totalCount,
        logsLast7Days: recentCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete old logs (cleanup)
 *
 * DELETE /api/activity-log/cleanup
 * Admin endpoint (super_admin only)
 * Query params: ?olderThanDays=30
 * Returns: { message, deleted }
 */
export const cleanupOldLogs = async (req, res, next) => {
  try {
    const { olderThanDays = 30 } = req.query;

    // Calculate date
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

    // Delete logs older than cutoff
    const result = await ActivityLog.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    res.status(200).json({
      success: true,
      message: `Deleted logs older than ${olderThanDays} days`,
      deleted: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};
