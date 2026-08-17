import express from 'express';
import { registerUser, loginUser, getMe, getAllUsers } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Primary authentication endpoints
router.post('/register', registerUser);
router.post('/auth/register', registerUser);
router.post('/login', loginUser);
router.post('/auth/login', loginUser);
router.get('/me', protect, getMe);
router.get('/users', getAllUsers);

export default router;


