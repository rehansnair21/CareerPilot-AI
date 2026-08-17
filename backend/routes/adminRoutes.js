import express from 'express';
import {
  getAdminStats,
  getAllUsersAdmin,
  deleteUserAdmin,
  getAllJobsAdmin,
} from '../controllers/adminController.js';
import { protect, adminProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect & adminProtect to all admin endpoints
router.use(protect);
router.use(adminProtect);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsersAdmin);
router.delete('/users/:collectionName/:id', deleteUserAdmin);
router.get('/jobs', getAllJobsAdmin);

export default router;
