import dotenv from 'dotenv';
// Load environment variables before anything else
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import recruiterRoutes from './routes/recruiterRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import mentorRoutes from './routes/mentorRoutes.js';
import seedAdmin from './utils/seedAdmin.js';

// Connect to MongoDB
await connectDB();
await seedAdmin();

const app = express();

// Middleware to ensure DB connection is ready
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database connection is currently unavailable. Please try again in a moment.'
    });
  }
  next();
});

// Middleware with 10MB limit for JSON body (supports image Base64 profile photos)
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api', authRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Express Error]:', err);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'The selected image file is too large. Please choose an image smaller than 3 MB.',
    });
  }
  return res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Express Server Running] Port: http://localhost:${PORT}`);
});
// Trigger nodemon reload for authController updates
