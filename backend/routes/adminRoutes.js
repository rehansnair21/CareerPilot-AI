import express from 'express';
import {
  getAdminStats,
  getAllUsersAdmin,
  deleteUserAdmin,
  toggleUserStatusAdmin,
  getAllJobsAdmin,
  getAllCoursesAdmin,
  getCourseDetailsAdmin,
  getCourseEnrollmentsAdmin,
  updateCourseStatusAdmin,
  getCourseResourcesAdmin,
  deleteCourseResourceAdmin,
  getQuizzesAndAssignmentsAdmin,
  deleteQuizOrAssignmentAdmin,
} from '../controllers/adminController.js';
import { protect, adminProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect & adminProtect to all admin endpoints
router.use(protect);
router.use(adminProtect);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsersAdmin);
router.put('/users/:collectionName/:id/toggle-status', toggleUserStatusAdmin);
router.delete('/users/:collectionName/:id', deleteUserAdmin);
router.get('/jobs', getAllJobsAdmin);

// Admin Course Management Routes
router.get('/courses', getAllCoursesAdmin);
router.get('/courses/:id', getCourseDetailsAdmin);
router.get('/courses/:id/enrollments', getCourseEnrollmentsAdmin);
router.patch('/courses/:id/status', updateCourseStatusAdmin);
router.get('/resources', getCourseResourcesAdmin);
router.delete('/resources/:resourceType/:id', deleteCourseResourceAdmin);
router.get('/quizzes-assignments', getQuizzesAndAssignmentsAdmin);
router.delete('/quizzes-assignments/:itemType/:id', deleteQuizOrAssignmentAdmin);

export default router;
