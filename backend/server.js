import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables reliably from backend/.env regardless of CWD
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('[FATAL]: JWT_SECRET environment variable is not set. Server cannot start securely.');
  process.exit(1);
}

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
// CORS: production allows only the explicitly configured frontend origin.
// Parse explicitly allowed frontend origins from environment
const getAllowedOrigins = () => {
  const origins = [];
  if (process.env.CLIENT_URL) {
    process.env.CLIENT_URL.split(',').forEach((url) => {
      const normalized = url.trim().replace(/\/+$/, '');
      if (normalized && !origins.includes(normalized)) {
        origins.push(normalized);
      }
    });
  } else {
    console.warn('[CORS Warning]: CLIENT_URL environment variable is not set. Cross-origin requests from frontend may be blocked in production.');
  }

  // Allow local frontend dev servers when not in production
  if (process.env.NODE_ENV !== 'production') {
    const devOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];
    devOrigins.forEach((dev) => {
      if (!origins.includes(dev)) origins.push(dev);
    });
  }

  return origins;
};

const allowedOrigins = getAllowedOrigins();

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.trim().replace(/\/+$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.warn(`[CORS Blocked]: Origin "${origin}" is not in allowed origins:`, allowedOrigins);
    return callback(new Error(`CORS: Origin "${origin}" is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check and root status endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'CareerPilot AI API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

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
