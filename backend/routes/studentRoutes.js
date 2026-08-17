import express from 'express';
import multer from 'multer';
import {
  getStudentDashboardStats,
  getStudentProfile,
  updateStudentProfile,
  analyzeStudentResume,
  getLatestResumeAnalysis,
  syncResumeSkills,
  getAvailableJobsForStudent,
  applyToJob,
  downloadJobDescriptionPdf,
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
router.post('/resume/sync-skills', protect, syncResumeSkills);

// Job Postings & Applications for Students
router.get('/jobs', protect, getAvailableJobsForStudent);
router.get('/jobs/:id/download-jd', protect, downloadJobDescriptionPdf);
router.post('/jobs/apply', protect, applyToJob);

export default router;
