import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import {
  getRecruiterStats,
  getRecruiterProfile,
  updateRecruiterProfile,
  createJob,
  parseJobDescription,
  getRecruiterJobs,
  getJobById,
  updateJob,
  deleteJob,
  getApplications,
  getStudentProfileForRecruiter,
  downloadCandidateResume,
  updateApplicationStatus,
  deleteApplication,
  getCandidates,
} from '../controllers/recruiterController.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// All recruiter routes are protected
router.use(protect);

// Dashboard Statistics
router.get('/stats', getRecruiterStats);

// Profile Management
router.get('/profile', getRecruiterProfile);
router.put('/profile', updateRecruiterProfile);

// Job Postings Management
router.post('/jobs/parse-jd', upload.single('jdFile'), parseJobDescription);
router.post('/jobs', createJob);
router.get('/jobs', getRecruiterJobs);
router.get('/jobs/:id', getJobById);
router.put('/jobs/:id', updateJob);
router.delete('/jobs/:id', deleteJob);

// Application Pipeline Management
router.get('/applications', getApplications);
router.get('/applications/:id/student-profile', getStudentProfileForRecruiter);
router.get('/applications/:id/download-resume', downloadCandidateResume);
router.put('/applications/:id/status', updateApplicationStatus);
router.delete('/applications/:id', deleteApplication);

// Candidates Discovery
router.get('/candidates', getCandidates);

export default router;
