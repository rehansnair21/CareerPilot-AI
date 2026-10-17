import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Recruiter from '../models/Recruiter.js';
import Admin from '../models/Admin.js';
import Mentor from '../models/Mentor.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      if (!process.env.JWT_SECRET) {
        console.error('[Auth Middleware Error]: JWT_SECRET environment variable is not configured.');
        return res.status(500).json({ success: false, message: 'Server security configuration error' });
      }
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      let user = null;

      // 1. Try finding in Admin model (admins collection)
      if (decoded.id) {
        user = await Admin.findById(decoded.id).select('-password');
      }
      if (!user && decoded.email) {
        user = await Admin.findOne({ email: decoded.email.toLowerCase() }).select('-password');
      }
      if (user) {
        user = user.toObject ? user.toObject() : user;
        user.role = 'admin';
      }

      // 2. Try finding in Mentor model (mentors collection)
      if (!user) {
        if (decoded.id) {
          user = await Mentor.findById(decoded.id).select('-password');
        }
        if (!user && decoded.email) {
          user = await Mentor.findOne({ email: decoded.email.toLowerCase() }).select('-password');
        }
        if (user) {
          user = user.toObject ? user.toObject() : user;
          user.role = 'mentor';
        }
      }

      // 3. Try finding in User model (students)
      if (!user) {
        if (decoded.id) {
          user = await User.findById(decoded.id).select('-password');
        }
        if (!user && decoded.email) {
          user = await User.findOne({ email: decoded.email.toLowerCase() }).select('-password');
        }
      }

      // 4. Try finding in Recruiter model (recruiters table)
      if (!user) {
        if (decoded.id) {
          user = await Recruiter.findById(decoded.id).select('-password');
        }
        if (!user && decoded.email) {
          user = await Recruiter.findOne({ email: decoded.email.toLowerCase() }).select('-password');
        }
        if (user) {
          user = user.toObject ? user.toObject() : user;
          user.role = 'recruiter';
        }
      }

      if (!user) {
        return res.status(401).json({ success: false, message: 'User session expired. Please log in again.' });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('[Auth Middleware Error]:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

// Middleware to ensure user has Admin role
export const adminProtect = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied: Administrator privilege required'
  });
};

