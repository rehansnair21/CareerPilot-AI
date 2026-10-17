import express from 'express';
import multer from 'multer';
import {
  getStudentDashboardStats,
  getStudentProfile,
  updateStudentProfile,
  analyzeStudentResume,
  getLatestResumeAnalysis,
  deleteStudentResume,
  syncResumeSkills,
  getAvailableJobsForStudent,
  applyToJob,
  downloadJobDescriptionPdf,
  analyzeStudentPortfolio,
  getLatestPortfolioAnalysis,
  deleteStudentPortfolio,
  generateAssessmentChallenge,
  runAssessmentCode,
  submitAssessmentCode,
  getAssessmentHistory,
  generateSoftSkillAssessment,
  submitSoftSkillAssessment,
  getSoftSkillAssessmentHistory,
  getCareerRecommendations,
  generateCareerRecommendationsController,
  getStudentRoadmap,
  saveStudentRoadmap,
  getPublishedCoursesForStudent,
  getStudentCourseDetails,
  streamStudentCoursePDF,
  submitStudentQuizAttempt,
  getStudentQuizAttempts,
  getStudentCourseLearningData,
  toggleStudentItemProgress,
  submitStudentAssignment,
  enrollStudentInCourse,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getStudentEnrollments,
  getCourseEnrollmentStatus,
  getStudentMessages,
  markStudentMessageAsRead,
  replyToMentorMessage,
  getStudentNotifications,
  markStudentNotificationAsRead,
  markAllStudentNotificationsAsRead,
  getStudentUnreadCount,
} from '../controllers/studentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Multer memory storage configuration for resume file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(pdf|docx|doc|txt)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Please upload a PDF, DOCX, DOC, or TXT file.'));
    }
  },
});

// GET /api/student/dashboard-stats
router.get('/dashboard-stats', protect, getStudentDashboardStats);

// GET & PUT /api/student/profile
router.get('/profile', protect, getStudentProfile);
router.put('/profile', protect, updateStudentProfile);

// AI Resume Analysis Routes
router.post('/resume/analyze', protect, upload.single('resume'), analyzeStudentResume);
router.get('/resume/latest', protect, getLatestResumeAnalysis);
router.delete('/resume', protect, deleteStudentResume);
router.post('/resume/sync-skills', protect, syncResumeSkills);

// AI Portfolio Analysis Routes
router.post('/portfolio/analyze', protect, analyzeStudentPortfolio);
router.get('/portfolio/latest', protect, getLatestPortfolioAnalysis);
router.delete('/portfolio', protect, deleteStudentPortfolio);

// AI Coding Assessment Routes
router.post('/assessment/generate-challenge', protect, generateAssessmentChallenge);
router.post('/assessment/run-code', protect, runAssessmentCode);
router.post('/assessment/submit', protect, submitAssessmentCode);
router.get('/assessment/history', protect, getAssessmentHistory);

// AI Soft Skill Assessment Routes
router.post('/assessment/soft-skill/generate', protect, generateSoftSkillAssessment);
router.post('/assessment/soft-skill/submit', protect, submitSoftSkillAssessment);
router.get('/assessment/soft-skill/history', protect, getSoftSkillAssessmentHistory);

// AI Career Recommendations Routes
router.get('/career-recommendations', protect, getCareerRecommendations);
router.post('/career-recommendations/generate', protect, generateCareerRecommendationsController);

// Student Personalized Roadmap Routes (Isolated per user ID)
router.get('/roadmap', protect, getStudentRoadmap);
router.post('/roadmap/select', protect, saveStudentRoadmap);

// Student Jobs & Job Application Routes
router.get('/jobs', protect, getAvailableJobsForStudent);
router.post('/jobs/apply', protect, upload.single('resume'), applyToJob);
router.get('/jobs/:jobId/download-jd', protect, downloadJobDescriptionPdf);

// Published Mentor Courses & Learning Resources for Students
router.get('/courses', protect, getPublishedCoursesForStudent);
router.get('/courses/:courseId', protect, getStudentCourseDetails);
router.get('/courses/:courseId/learning', protect, getStudentCourseLearningData);
router.post('/courses/:courseId/progress/toggle-item', protect, toggleStudentItemProgress);
router.post('/courses/:courseId/assignments/:resourceId/submit', protect, submitStudentAssignment);
router.get('/courses/:courseId/pdf-resources/:resourceId/stream', protect, streamStudentCoursePDF);

// Student Course Enrollments & Razorpay Payment Routes (course_enrollments collection)
router.post('/courses/:courseId/create-order', protect, createRazorpayOrder);
router.post('/courses/:courseId/verify-payment', protect, verifyRazorpayPayment);
router.post('/courses/:courseId/enroll', protect, enrollStudentInCourse);
router.get('/enrollments', protect, getStudentEnrollments);
router.get('/courses/:courseId/enrollment-status', protect, getCourseEnrollmentStatus);

// Student Course Quiz Submissions & Attempts
router.post('/courses/:courseId/quizzes/:quizId/submit', protect, submitStudentQuizAttempt);
router.get('/courses/:courseId/quizzes/:quizId/attempts', protect, getStudentQuizAttempts);

// Mentor Messages for Students (Reception, Reading, Replying)
router.get('/messages', protect, getStudentMessages);
router.put('/messages/:messageId/read', protect, markStudentMessageAsRead);
router.post('/messages/:messageId/reply', protect, replyToMentorMessage);

// Student Notifications & Unread Counts
router.get('/notifications', protect, getStudentNotifications);
router.put('/notifications/read-all', protect, markAllStudentNotificationsAsRead);
router.put('/notifications/:id/read', protect, markStudentNotificationAsRead);
router.get('/unread-count', protect, getStudentUnreadCount);

export default router;



