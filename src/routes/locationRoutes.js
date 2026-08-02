/**
 * Location Routes
 *
 * GET /api/locations - Get all locations (public: active only, admin: all)
 * POST /api/locations - Create location (admin)
 * PUT /api/locations/:id - Update location (admin)
 * DELETE /api/locations/:id - Delete location (admin)
 */

import express from 'express';
import {
  getAllLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../controllers/locationController.js';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalAuthenticate, getAllLocations);

router.post('/', authenticate, authorize('super_admin', 'editor'), createLocation);
router.put('/:id', authenticate, authorize('super_admin', 'editor'), updateLocation);
router.delete('/:id', authenticate, authorize('super_admin', 'editor'), deleteLocation);

export default router;
