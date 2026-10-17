import express from 'express';
import multer from 'multer';
import {
  getMentorProfile,
  updateMentorProfile,
  getMentorDashboardStats,
  createCourse,
  getMentorCourses,
  getCourseById,
  updateCourse,
  toggleCourseStatus,
  deleteCourse,
  getCourseModules,
  addCourseModule,
  updateCourseModule,
  deleteCourseModule,
  reorderCourseModules,
  getModuleLessons,
  addModuleLesson,
  updateModuleLesson,
  deleteModuleLesson,
  reorderModuleLessons,
  getCoursePDFResources,
  uploadCoursePDFResource,
  updateCoursePDFResource,
  deleteCoursePDFResource,
  streamCoursePDFResource,
  getCourseTextResources,
  addCourseTextResource,
  updateCourseTextResource,
  deleteCourseTextResource,
  getCourseQuizzes,
  createCourseQuiz,
  updateCourseQuiz,
  deleteCourseQuiz,
  getMentorCoursePreview,
  getMentorCourseEnrollments,
  getMentorStudentProgress,
  getIndividualStudentProgress,
  getStudentsNeedingAttention,
  sendMentorMessage,
  getMentorMessages,
  markMentorMessageRead,
  getMentorUnreadCount,
} from '../controllers/mentorController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Multer storage & filter configuration for PDF resources (10 MB limit)
const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.match(/\.pdf$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF documents (.pdf) are allowed'));
    }
  },
});

// Profile Routes
router.get('/profile', protect, getMentorProfile);
router.put('/profile', protect, updateMentorProfile);

// Dashboard Stats Route
router.get('/dashboard-stats', protect, getMentorDashboardStats);

// Enrolled Students / Course Enrollments Route
router.get('/enrollments', protect, getMentorCourseEnrollments);

// Student Progress Routes (Detailed progress, quiz scores, assignments, timeline, attention)
router.get('/student-progress', protect, getMentorStudentProgress);
router.get('/student-progress/:enrollmentId', protect, getIndividualStudentProgress);
router.get('/students-needing-attention', protect, getStudentsNeedingAttention);

// Mentor-to-Student Messaging Routes
router.post('/messages', protect, sendMentorMessage);
router.get('/messages', protect, getMentorMessages);
router.put('/messages/:messageId/read', protect, markMentorMessageRead);
router.get('/unread-count', protect, getMentorUnreadCount);

// Course Management Routes
router.post('/courses', protect, createCourse);
router.get('/courses', protect, getMentorCourses);
router.get('/courses/:id', protect, getCourseById);
router.get('/courses/:courseId/preview', protect, getMentorCoursePreview);
router.put('/courses/:id', protect, updateCourse);
router.patch('/courses/:id/status', protect, toggleCourseStatus);
router.delete('/courses/:id', protect, deleteCourse);

// Course Module Routes
router.get('/courses/:courseId/modules', protect, getCourseModules);
router.post('/courses/:courseId/modules', protect, addCourseModule);
router.put('/courses/:courseId/modules/reorder', protect, reorderCourseModules);
router.put('/courses/:courseId/modules/:moduleId', protect, updateCourseModule);
router.delete('/courses/:courseId/modules/:moduleId', protect, deleteCourseModule);

// Course Lesson Routes (100% Text-Based)
router.get('/courses/:courseId/modules/:moduleId/lessons', protect, getModuleLessons);
router.post('/courses/:courseId/modules/:moduleId/lessons', protect, addModuleLesson);
router.put('/courses/:courseId/modules/:moduleId/lessons/reorder', protect, reorderModuleLessons);
router.put('/courses/:courseId/modules/:moduleId/lessons/:lessonId', protect, updateModuleLesson);
router.delete('/courses/:courseId/modules/:moduleId/lessons/:lessonId', protect, deleteModuleLesson);

// Course PDF Resource Routes (Authenticated Mentor Management)
router.get('/courses/:courseId/pdf-resources', protect, getCoursePDFResources);
router.post('/courses/:courseId/pdf-resources', protect, pdfUpload.single('pdfFile'), uploadCoursePDFResource);
router.put('/courses/:courseId/pdf-resources/:resourceId', protect, pdfUpload.single('pdfFile'), updateCoursePDFResource);
router.delete('/courses/:courseId/pdf-resources/:resourceId', protect, deleteCoursePDFResource);
router.get('/courses/:courseId/pdf-resources/:resourceId/stream', protect, streamCoursePDFResource);

// Course Text Resource Routes (Articles, Docs, Practice websites, Reference links, Notes)
router.get('/courses/:courseId/text-resources', protect, getCourseTextResources);
router.post('/courses/:courseId/text-resources', protect, addCourseTextResource);
router.put('/courses/:courseId/text-resources/:resourceId', protect, updateCourseTextResource);
router.delete('/courses/:courseId/text-resources/:resourceId', protect, deleteCourseTextResource);

// Course Quiz Routes (Multiple Choice Quizzes & Questions)
router.get('/courses/:courseId/quizzes', protect, getCourseQuizzes);
router.post('/courses/:courseId/quizzes', protect, createCourseQuiz);
router.put('/courses/:courseId/quizzes/:quizId', protect, updateCourseQuiz);
router.delete('/courses/:courseId/quizzes/:quizId', protect, deleteCourseQuiz);

export default router;


