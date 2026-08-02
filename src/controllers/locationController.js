/**
 * Location Controller
 *
 * Manages physical store locations shown in the "Find Us" map section:
 * - Get all locations (public - active only; admins see all)
 * - Create/update/delete location (admin)
 *
 * All admin operations are logged in ActivityLog
 */

import Location from '../models/Location.js';
import ActivityLog from '../models/ActivityLog.js';
import {
  validate,
  createLocationSchema,
  updateLocationSchema,
} from '../utils/validators.js';
import { ErrorTypes } from '../utils/errorHandler.js';
import { emitUpdate } from '../realtime.js';

/**
 * Get all locations
 *
 * GET /api/locations
 * Public: returns only active locations, sorted by order
 * Admin (valid token): returns all locations
 */
export const getAllLocations = async (req, res, next) => {
  try {
    const filter = req.user ? {} : { isActive: true };

    const locations = await Location.find(filter).sort({
      order: 1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      locations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create location
 *
 * POST /api/locations
 * Requires: Admin authentication
 */
export const createLocation = async (req, res, next) => {
  try {
    const { error, value } = validate(createLocationSchema, req.body);
    if (error) {
      throw ErrorTypes.VALIDATION_ERROR('Validation failed', error.details);
    }

    const location = await Location.create({
      ...value,
      createdBy: req.user._id,
    });

    await ActivityLog.create({
      'admin.id': req.user._id,
      'admin.name': req.user.name,
      'admin.email': req.user.email,
      action: 'create_location',
      resourceType: 'location',
      resourceId: location._id,
      changesSummary: `Added location: ${location.name}`,
      newValue: location.toObject(),
    });

    emitUpdate('locations');

    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      location,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update location
 *
 * PUT /api/locations/:id
 * Requires: Admin authentication
 */
export const updateLocation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error, value } = validate(updateLocationSchema, req.body);
    if (error) {
      throw ErrorTypes.VALIDATION_ERROR('Validation failed', error.details);
    }

    const location = await Location.findById(id);
    if (!location) {
      throw ErrorTypes.NOT_FOUND('Location not found');
    }

    const oldValue = location.toObject();
    Object.assign(location, value);
    await location.save();

    await ActivityLog.create({
      'admin.id': req.user._id,
      'admin.name': req.user.name,
      'admin.email': req.user.email,
      action: 'edit_location',
      resourceType: 'location',
      resourceId: location._id,
      changesSummary: `Updated location: ${location.name}`,
      oldValue,
      newValue: location.toObject(),
    });

    emitUpdate('locations');

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      location,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete location
 *
 * DELETE /api/locations/:id
 * Requires: Admin authentication
 */
export const deleteLocation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const location = await Location.findById(id);
    if (!location) {
      throw ErrorTypes.NOT_FOUND('Location not found');
    }

    const oldValue = location.toObject();
    await Location.findByIdAndDelete(id);

    await ActivityLog.create({
      'admin.id': req.user._id,
      'admin.name': req.user.name,
      'admin.email': req.user.email,
      action: 'delete_location',
      resourceType: 'location',
      resourceId: id,
      changesSummary: `Deleted location: ${oldValue.name}`,
      oldValue,
    });

    emitUpdate('locations');

    res.status(200).json({
      success: true,
      message: 'Location deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
