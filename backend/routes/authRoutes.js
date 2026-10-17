import express from 'express';
import { registerUser, loginUser, getMe, getAllUsers, googleVerify, changePassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Primary authentication endpoints
router.post('/register', registerUser);
router.post('/auth/register', registerUser);
router.post('/login', loginUser);
router.post('/auth/login', loginUser);
router.get('/me', protect, getMe);
router.get('/users', getAllUsers);
router.put('/password', protect, changePassword);
router.put('/auth/password', protect, changePassword);

// Google OAuth (ID-token verification from frontend GSI popup)
router.post('/google/verify', googleVerify);
router.post('/auth/google/verify', googleVerify);

export default router;
