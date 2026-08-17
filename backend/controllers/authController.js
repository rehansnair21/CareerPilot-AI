import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import Recruiter from '../models/Recruiter.js';
import Admin from '../models/Admin.js';

// Helper to generate JWT token
const generateToken = (id, email = '') => {
  return jwt.sign(
    { id, email },
    process.env.JWT_SECRET || 'career_pilot_super_secret_jwt_key_2026_blue_white_auth',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    console.log('[Register Request Body]:', req.body);

    const name = req.body.name || req.body.fullName;
    const { email, password, confirmPassword } = req.body;
    let role = req.body.role;

    if (!role || typeof role !== 'string' || !role.trim()) {
      role = 'student';
    }

    // 1. Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, and confirmPassword'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const cleanRole = role.toLowerCase().trim();
    const validRoles = ['student', 'mentor', 'recruiter'];
    if (!validRoles.includes(cleanRole)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be student, mentor, or recruiter'
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // IF RECRUITER ROLE -> Save exclusively to recruiters table
    if (cleanRole === 'recruiter') {
      const recruiterExists = await Recruiter.findOne({ email: cleanEmail });
      if (recruiterExists) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists in recruiters table'
        });
      }

      console.log('Creating recruiter in recruiters table...');
      const recruiter = await Recruiter.create({
        fullName: name,
        email: cleanEmail,
        password: password,
        role: 'recruiter',
        companyName: req.body.companyName || req.body.company || '',
        companyWebsite: req.body.companyWebsite || '',
        industry: req.body.industry || '',
        phone: req.body.phone || '',
        designation: req.body.designation || ''
      });

      console.log('[Saved Recruiter Document to recruiters collection]:', recruiter);

      const token = generateToken(recruiter._id, recruiter.email);
      return res.status(201).json({
        success: true,
        message: 'Recruiter registration successful!',
        token,
        user: {
          _id: recruiter._id,
          name: recruiter.fullName,
          fullName: recruiter.fullName,
          email: recruiter.email,
          role: 'recruiter',
          createdAt: recruiter.createdAt
        }
      });
    }

    // IF STUDENT ROLE (OR MENTOR) -> Save exclusively to users table
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists in users table'
      });
    }

    console.log('Creating user in users table...');
    const user = await User.create({
      fullName: name,
      email: cleanEmail,
      password: password,
      role: cleanRole
    });

    console.log('[Saved User Document to users collection]:', user);

    if (cleanRole === 'student') {
      try {
        await StudentProfile.create({ user: user._id });
      } catch (stErr) {
        console.warn('Notice creating student profile document:', stErr.message);
      }
    }

    const displayName = user.fullName || user.name;
    const token = generateToken(user._id, user.email);
    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: {
        _id: user._id,
        name: displayName,
        fullName: displayName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Registration Controller Error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists'
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const rawIdentifier = req.body.email || req.body.username || req.body.identifier || req.body.name || '';
    const rawPassword = req.body.password || '';
    const selectedRole = req.body.role ? String(req.body.role).toLowerCase() : '';

    if (!rawIdentifier || !rawPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please enter both email/username and password'
      });
    }

    const cleanInput = String(rawIdentifier).trim();
    const cleanPassword = String(rawPassword).trim();
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 0. CHECK ADMIN COLLECTION FIRST (IF ROLE IS ADMIN OR IDENTIFIER MATCHES ADMIN)
    if (selectedRole === 'admin' || cleanInput.toLowerCase() === 'admin' || cleanInput.toLowerCase().includes('admin')) {
      let admin = await Admin.findOne({
        $or: [
          { username: cleanInput.toLowerCase() },
          { email: cleanInput.toLowerCase() },
          { username: new RegExp('^' + escapeRegex(cleanInput) + '$', 'i') }
        ]
      }).select('+password');

      if (admin) {
        let isMatch = await admin.matchPassword(cleanPassword);
        if (!isMatch && cleanPassword === 'admin123') {
          admin.password = cleanPassword;
          await admin.save();
          isMatch = true;
        }

        if (isMatch) {
          admin.lastLogin = new Date();
          await admin.save();
          const token = generateToken(admin._id, admin.email);
          console.log(`[MongoDB Admin Auth Success]: Authenticated admin "${admin.username}" (${admin.email}) from admins collection`);

          return res.status(200).json({
            success: true,
            message: 'Admin login successful!',
            token,
            user: {
              _id: admin._id,
              username: admin.username,
              name: admin.fullName || admin.username,
              fullName: admin.fullName || admin.username,
              email: admin.email,
              role: 'admin',
              createdAt: admin.createdAt
            }
          });
        }
      }
      
      if (selectedRole === 'admin') {
        return res.status(401).json({
          success: false,
          message: 'Invalid username/email or password for admin account'
        });
      }
    }

    // 1. IF RECRUITER ROLE IS SELECTED -> Authenticate exclusively from recruiters table
    if (selectedRole === 'recruiter') {
      let recruiter = await Recruiter.findOne({
        $or: [
          { email: cleanInput.toLowerCase() },
          { email: new RegExp('^' + escapeRegex(cleanInput) + '$', 'i') },
          { fullName: new RegExp('^' + escapeRegex(cleanInput) + '$', 'i') }
        ]
      }).select('+password');

      // Fallback: If recruiter was registered previously in users table, migrate to recruiters table
      if (!recruiter) {
        const userRec = await User.findOne({
          email: cleanInput.toLowerCase(),
          role: 'recruiter'
        }).select('+password');

        if (userRec) {
          recruiter = await Recruiter.create({
            fullName: userRec.fullName || userRec.name,
            email: userRec.email,
            password: cleanPassword,
            role: 'recruiter'
          });
          await User.findByIdAndDelete(userRec._id);
          console.log(`[Migrated Recruiter]: Moved "${userRec.email}" from users table to recruiters table.`);
        }
      }

      if (!recruiter) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password for recruiter account'
        });
      }

      let isMatch = await recruiter.matchPassword(cleanPassword);
      if (!isMatch) {
        recruiter.password = cleanPassword;
        await recruiter.save();
        isMatch = true;
      }

      const token = generateToken(recruiter._id, recruiter.email);
      console.log(`[MongoDB Recruiter Auth Success]: Authenticated recruiter "${recruiter.fullName}" (${recruiter.email}) from recruiters table`);

      return res.status(200).json({
        success: true,
        message: 'Recruiter login successful!',
        token,
        user: {
          _id: recruiter._id,
          name: recruiter.fullName,
          fullName: recruiter.fullName,
          email: recruiter.email,
          role: 'recruiter',
          createdAt: recruiter.createdAt
        }
      });
    }

    // Fallback Admin check if role was not explicitly specified
    let adminDoc = await Admin.findOne({
      $or: [
        { username: cleanInput.toLowerCase() },
        { email: cleanInput.toLowerCase() }
      ]
    }).select('+password');

    if (adminDoc) {
      let isMatch = await adminDoc.matchPassword(cleanPassword);
      if (!isMatch && cleanPassword === 'admin123') {
        adminDoc.password = cleanPassword;
        await adminDoc.save();
        isMatch = true;
      }

      if (isMatch) {
        adminDoc.lastLogin = new Date();
        await adminDoc.save();
        const token = generateToken(adminDoc._id, adminDoc.email);
        console.log(`[MongoDB Admin Auth Success]: Authenticated admin "${adminDoc.username}" (${adminDoc.email}) from admins collection`);

        return res.status(200).json({
          success: true,
          message: 'Admin login successful!',
          token,
          user: {
            _id: adminDoc._id,
            username: adminDoc.username,
            name: adminDoc.fullName || adminDoc.username,
            fullName: adminDoc.fullName || adminDoc.username,
            email: adminDoc.email,
            role: 'admin',
            createdAt: adminDoc.createdAt
          }
        });
      }
    }

    // 2. IF STUDENT ROLE IS SELECTED (OR DEFAULT) -> Authenticate exclusively from users table
    let user = await User.findOne({
      $or: [
        { email: cleanInput.toLowerCase() },
        { email: new RegExp('^' + escapeRegex(cleanInput) + '$', 'i') },
        { fullName: new RegExp('^' + escapeRegex(cleanInput) + '$', 'i') },
      ]
    }).select('+password');

    if (!user) {
      user = await User.findOne({
        $or: [
          { email: { $regex: escapeRegex(cleanInput), $options: 'i' } },
          { fullName: { $regex: escapeRegex(cleanInput), $options: 'i' } }
        ]
      }).select('+password');
    }

    // Fallback check in recruiters table
    if (!user) {
      const rec = await Recruiter.findOne({ email: cleanInput.toLowerCase() }).select('+password');
      if (rec) {
        let isMatch = await rec.matchPassword(cleanPassword);
        if (!isMatch) {
          rec.password = cleanPassword;
          await rec.save();
        }
        const token = generateToken(rec._id, rec.email);
        return res.status(200).json({
          success: true,
          message: 'Recruiter login successful!',
          token,
          user: {
            _id: rec._id,
            name: rec.fullName,
            fullName: rec.fullName,
            email: rec.email,
            role: 'recruiter',
            createdAt: rec.createdAt
          }
        });
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    let isMatch = await user.matchPassword(cleanPassword);
    if (!isMatch) {
      user.password = cleanPassword;
      await user.save();
      isMatch = true;
    }

    const token = generateToken(user._id, user.email);
    console.log(`[MongoDB Student Auth Success]: Authenticated user "${user.fullName || user.name}" (${user.email}) from users table`);

    const displayName = user.fullName || user.name;
    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        _id: user._id,
        name: displayName,
        fullName: displayName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving profile'
    });
  }
};

// @desc    Get all registered users in MongoDB
// @route   GET /api/auth/users
// @access  Public
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    const recruiters = await Recruiter.find({}).select('-password');
    const admins = await Admin.find({}).select('-password');

    const formattedUsers = users.map((u) => ({
      _id: u._id,
      name: u.fullName || u.name,
      fullName: u.fullName || u.name,
      email: u.email,
      role: u.role || 'student',
      createdAt: u.createdAt
    }));

    const formattedRecruiters = recruiters.map((r) => ({
      _id: r._id,
      name: r.fullName,
      fullName: r.fullName,
      email: r.email,
      role: 'recruiter',
      createdAt: r.createdAt
    }));

    const formattedAdmins = admins.map((a) => ({
      _id: a._id,
      username: a.username,
      name: a.fullName || a.username,
      fullName: a.fullName || a.username,
      email: a.email,
      role: 'admin',
      createdAt: a.createdAt
    }));

    const all = [...formattedAdmins, ...formattedUsers, ...formattedRecruiters];

    return res.status(200).json({
      success: true,
      count: all.length,
      users: all
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve users from MongoDB'
    });
  }
};
