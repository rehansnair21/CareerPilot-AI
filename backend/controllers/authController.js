import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import Recruiter from '../models/Recruiter.js';
import Admin from '../models/Admin.js';
import Mentor from '../models/Mentor.js';

const getGoogleClient = () => new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to generate JWT token
// JWT_SECRET MUST be set in environment variables — no insecure fallback.
const generateToken = (id, email = '') => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.');
  }
  return jwt.sign(
    { id, email },
    secret,
    { expiresIn: '30d' }
  );
};

export const validateRegistrationName = (name) => {
  if (!name || (typeof name === 'string' && !name.trim())) {
    return 'Full name is required.';
  }
  if (typeof name !== 'string') {
    return 'Name can contain only letters and spaces.';
  }
  const trimmed = name.trim();
  if (trimmed.length < 3 || trimmed.length > 50 || name.length > 50) {
    return 'Name must be between 3 and 50 characters.';
  }
  if (!/^[a-zA-Z\s]+$/.test(name)) {
    return 'Name can contain only letters and spaces.';
  }
  return null;
};

export const validateRegistrationPassword = (password) => {
  if (!password || (typeof password === 'string' && !password.trim())) {
    return 'Password is required.';
  }
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number.';
  }
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password) || /[^A-Za-z0-9\s]/.test(password);
  if (!hasSpecialChar) {
    return 'Password must contain at least one special character.';
  }
  return null;
};

export const validateRegistrationConfirmPassword = (confirmPassword, password) => {
  if (!confirmPassword || (typeof confirmPassword === 'string' && !confirmPassword.trim())) {
    return 'Please confirm your password.';
  }
  if (confirmPassword !== password) {
    return 'Passwords do not match.';
  }
  return null;
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
    const nameError = validateRegistrationName(name);
    if (nameError) {
      return res.status(400).json({
        success: false,
        message: nameError,
        errors: { name: nameError }
      });
    }

    if (!email || (typeof email === 'string' && !email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, and confirmPassword'
      });
    }

    const passwordError = validateRegistrationPassword(password);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
        errors: { password: passwordError }
      });
    }

    const confirmPasswordError = validateRegistrationConfirmPassword(confirmPassword, password);
    if (confirmPasswordError) {
      return res.status(400).json({
        success: false,
        message: confirmPasswordError,
        errors: { confirmPassword: confirmPasswordError }
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

    // IF MENTOR ROLE -> Save exclusively to mentors collection
    if (cleanRole === 'mentor') {
      const mentorExists = await Mentor.findOne({ email: cleanEmail });
      if (mentorExists) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists in mentors collection'
        });
      }

      console.log('Creating mentor in mentors collection...');
      const mentor = await Mentor.create({
        fullName: name,
        email: cleanEmail,
        password: password,
        role: 'mentor',
        company: req.body.company || '',
        designation: req.body.designation || '',
        bio: req.body.bio || '',
        phone: req.body.phone || ''
      });

      console.log('[Saved Mentor Document to mentors collection]:', mentor);

      const token = generateToken(mentor._id, mentor.email);
      return res.status(201).json({
        success: true,
        message: 'Mentor registration successful!',
        token,
        user: {
          _id: mentor._id,
          name: mentor.fullName,
          fullName: mentor.fullName,
          email: mentor.email,
          role: 'mentor',
          createdAt: mentor.createdAt
        }
      });
    }

    // IF STUDENT ROLE -> Save exclusively to users table
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
    const selectedRole = req.body.role ? String(req.body.role).toLowerCase().trim() : '';

    if (!rawIdentifier || !rawPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please enter both email/username and password'
      });
    }

    const cleanInput = String(rawIdentifier).trim();
    const cleanPassword = String(rawPassword).trim();
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 1. ADMIN ROLE (Explicitly requested or username matches 'admin')
    if (selectedRole === 'admin' || cleanInput.toLowerCase() === 'admin') {
      const admin = await Admin.findOne({
        $or: [
          { username: cleanInput.toLowerCase() },
          { email: cleanInput.toLowerCase() },
          { username: new RegExp('^' + escapeRegex(cleanInput) + '$', 'i') }
        ]
      }).select('+password');

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username/email or password'
        });
      }

      const isMatch = await admin.matchPassword(cleanPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username/email or password'
        });
      }

      admin.lastLogin = new Date();
      await admin.save();
      const token = generateToken(admin._id, admin.email);
      console.log(`[Admin Auth Success]: Authenticated admin "${admin.username}" (${admin.email})`);

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

    // 2. RECRUITER ROLE
    if (selectedRole === 'recruiter') {
      let recruiter = await Recruiter.findOne({
        $or: [
          { email: cleanInput.toLowerCase() },
          { email: new RegExp('^' + escapeRegex(cleanInput) + '$', 'i') },
          { fullName: new RegExp('^' + escapeRegex(cleanInput) + '$', 'i') }
        ]
      }).select('+password');

      // Legacy check: account in users table must have valid password before migrating
      if (!recruiter) {
        const userRec = await User.findOne({
          email: cleanInput.toLowerCase(),
          role: 'recruiter'
        }).select('+password');

        if (userRec) {
          const isMatchLegacy = await userRec.matchPassword(cleanPassword);
          if (!isMatchLegacy) {
            return res.status(401).json({
              success: false,
              message: 'Invalid email or password'
            });
          }
          recruiter = await Recruiter.create({
            fullName: userRec.fullName || userRec.name,
            email: userRec.email,
            password: cleanPassword,
            role: 'recruiter'
          });
          await User.findByIdAndDelete(userRec._id);
          console.log(`[Migrated Recruiter]: Moved authenticated recruiter "${userRec.email}" to recruiters table.`);
        }
      }

      if (!recruiter) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      if (recruiter.isActive === false) {
        return res.status(403).json({
          success: false,
          message: 'Your recruiter account has been deactivated by administrator. Please contact support.'
        });
      }

      const isMatchRecruiter = await recruiter.matchPassword(cleanPassword);
      if (!isMatchRecruiter) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const token = generateToken(recruiter._id, recruiter.email);
      console.log(`[Recruiter Auth Success]: Authenticated recruiter "${recruiter.fullName}" (${recruiter.email})`);

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

    // 3. MENTOR ROLE
    if (selectedRole === 'mentor') {
      let mentor = await Mentor.findOne({
        $or: [
          { email: cleanInput.toLowerCase() },
          { email: new RegExp('^' + escapeRegex(cleanInput) + '$', 'i') },
          { fullName: new RegExp('^' + escapeRegex(cleanInput) + '$', 'i') }
        ]
      }).select('+password');

      // Legacy check: account in users table must have valid password before migrating
      if (!mentor) {
        const userMen = await User.findOne({
          email: cleanInput.toLowerCase(),
          role: 'mentor'
        }).select('+password');

        if (userMen) {
          const isMatchLegacy = await userMen.matchPassword(cleanPassword);
          if (!isMatchLegacy) {
            return res.status(401).json({
              success: false,
              message: 'Invalid email or password'
            });
          }
          mentor = await Mentor.create({
            fullName: userMen.fullName || userMen.name,
            email: userMen.email,
            password: cleanPassword,
            role: 'mentor'
          });
          await User.findByIdAndDelete(userMen._id);
          console.log(`[Migrated Mentor]: Moved authenticated mentor "${userMen.email}" to mentors collection.`);
        }
      }

      if (!mentor) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      if (mentor.isActive === false) {
        return res.status(403).json({
          success: false,
          message: 'Your mentor account has been deactivated by administrator. Please contact support.'
        });
      }

      const isMatchMentor = await mentor.matchPassword(cleanPassword);
      if (!isMatchMentor) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const token = generateToken(mentor._id, mentor.email);
      console.log(`[Mentor Auth Success]: Authenticated mentor "${mentor.fullName}" (${mentor.email})`);

      return res.status(200).json({
        success: true,
        message: 'Mentor login successful!',
        token,
        user: {
          _id: mentor._id,
          name: mentor.fullName,
          fullName: mentor.fullName,
          email: mentor.email,
          role: 'mentor',
          createdAt: mentor.createdAt
        }
      });
    }

    // 4. STUDENT ROLE OR UNQUALIFIED ROLE
    // Check Student in users collection
    let user = await User.findOne({
      $or: [
        { email: cleanInput.toLowerCase() },
        { email: new RegExp('^' + escapeRegex(cleanInput) + '$', 'i') },
        { fullName: new RegExp('^' + escapeRegex(cleanInput) + '$', 'i') }
      ]
    }).select('+password');

    if (user) {
      if (user.isActive === false) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated by administrator. Please contact support.'
        });
      }

      const isMatch = await user.matchPassword(cleanPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const token = generateToken(user._id, user.email);
      console.log(`[Student Auth Success]: Authenticated student "${user.fullName || user.name}" (${user.email})`);

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
          role: user.role || 'student',
          createdAt: user.createdAt
        }
      });
    }

    // If role was not explicitly specified, check fallback collections
    if (!selectedRole) {
      // Fallback Recruiter
      const rec = await Recruiter.findOne({ email: cleanInput.toLowerCase() }).select('+password');
      if (rec) {
        if (rec.isActive === false) {
          return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
        }
        const isMatchRec = await rec.matchPassword(cleanPassword);
        if (!isMatchRec) {
          return res.status(401).json({ success: false, message: 'Invalid email or password' });
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

      // Fallback Mentor
      const men = await Mentor.findOne({ email: cleanInput.toLowerCase() }).select('+password');
      if (men) {
        if (men.isActive === false) {
          return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
        }
        const isMatchMen = await men.matchPassword(cleanPassword);
        if (!isMatchMen) {
          return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        const token = generateToken(men._id, men.email);
        return res.status(200).json({
          success: true,
          message: 'Mentor login successful!',
          token,
          user: {
            _id: men._id,
            name: men.fullName,
            fullName: men.fullName,
            email: men.email,
            role: 'mentor',
            createdAt: men.createdAt
          }
        });
      }

      // Fallback Admin
      const adminDoc = await Admin.findOne({
        $or: [
          { username: cleanInput.toLowerCase() },
          { email: cleanInput.toLowerCase() }
        ]
      }).select('+password');
      if (adminDoc) {
        const isMatchAdmin = await adminDoc.matchPassword(cleanPassword);
        if (!isMatchAdmin) {
          return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        adminDoc.lastLogin = new Date();
        await adminDoc.save();
        const token = generateToken(adminDoc._id, adminDoc.email);
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

    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  } catch (error) {
    console.error('Login Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
};

// @desc    Change password for authenticated user (dedicated authenticated process)
// @route   PUT /api/auth/password
// @access  Private (Authenticated)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current password and new password'
      });
    }

    if (confirmNewPassword && newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const userId = req.user._id;
    const role = req.user.role;

    let account = null;
    if (role === 'admin') {
      account = await Admin.findById(userId).select('+password');
    } else if (role === 'recruiter') {
      account = await Recruiter.findById(userId).select('+password');
    } else if (role === 'mentor') {
      account = await Mentor.findById(userId).select('+password');
    } else {
      account = await User.findById(userId).select('+password');
    }

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    const isMatch = await account.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Save triggers pre-save bcrypt hashing hook
    account.password = newPassword;
    await account.save();

    console.log(`[Password Changed]: Successfully updated password for user "${account.email || account.username}" (${role})`);

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('[Change Password Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update password'
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
    const mentors = await Mentor.find({}).select('-password');

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

    const formattedMentors = mentors.map((m) => ({
      _id: m._id,
      name: m.fullName,
      fullName: m.fullName,
      email: m.email,
      role: 'mentor',
      createdAt: m.createdAt
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

    const all = [...formattedAdmins, ...formattedUsers, ...formattedRecruiters, ...formattedMentors];

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

// @desc    Google OAuth - Verify ID token from frontend (popup flow)
// @route   POST /api/auth/google/verify
// @access  Public
export const googleVerify = async (req, res) => {
  try {
    const { credential, role } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential token is required' });
    }

    // Verify the Google ID token
    const googleClient = getGoogleClient();
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Could not retrieve email from Google account' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const selectedRole = (role || 'student').toLowerCase().trim();

    // Reject admin role for Google OAuth
    if (selectedRole === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin accounts cannot use Google Sign-In' });
    }

    let authUser = null;
    let isNewUser = false;

    // ---- RECRUITER ----
    if (selectedRole === 'recruiter') {
      let recruiter = await Recruiter.findOne({ email: cleanEmail });
      if (!recruiter) {
        recruiter = await Recruiter.create({
          fullName: name,
          email: cleanEmail,
          password: `google_oauth_${googleId}`,
          role: 'recruiter',
          googleId,
          profilePhoto: picture || '',
        });
        isNewUser = true;
      } else if (!recruiter.googleId) {
        recruiter.googleId = googleId;
        await recruiter.save();
      }
      if (recruiter.isActive === false) {
        return res.status(403).json({ success: false, message: 'Your recruiter account has been deactivated. Please contact support.' });
      }
      const token = generateToken(recruiter._id, recruiter.email);
      return res.status(200).json({
        success: true,
        message: isNewUser ? 'Recruiter account created with Google!' : 'Recruiter login successful!',
        token,
        user: {
          _id: recruiter._id,
          name: recruiter.fullName,
          fullName: recruiter.fullName,
          email: recruiter.email,
          role: 'recruiter',
          profilePhoto: recruiter.profilePhoto || picture,
          createdAt: recruiter.createdAt,
        },
      });
    }

    // ---- MENTOR ----
    if (selectedRole === 'mentor') {
      let mentor = await Mentor.findOne({ email: cleanEmail });
      if (!mentor) {
        mentor = await Mentor.create({
          fullName: name,
          email: cleanEmail,
          password: `google_oauth_${googleId}`,
          role: 'mentor',
          googleId,
          profilePhoto: picture || '',
        });
        isNewUser = true;
      } else if (!mentor.googleId) {
        mentor.googleId = googleId;
        await mentor.save();
      }
      if (mentor.isActive === false) {
        return res.status(403).json({ success: false, message: 'Your mentor account has been deactivated. Please contact support.' });
      }
      const token = generateToken(mentor._id, mentor.email);
      return res.status(200).json({
        success: true,
        message: isNewUser ? 'Mentor account created with Google!' : 'Mentor login successful!',
        token,
        user: {
          _id: mentor._id,
          name: mentor.fullName,
          fullName: mentor.fullName,
          email: mentor.email,
          role: 'mentor',
          profilePhoto: mentor.profilePhoto || picture,
          createdAt: mentor.createdAt,
        },
      });
    }

    // ---- STUDENT (default) ----
    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      user = await User.create({
        fullName: name,
        email: cleanEmail,
        password: `google_oauth_${googleId}`,
        role: 'student',
        googleId,
        profilePhoto: picture || '',
      });
      try {
        await StudentProfile.create({ user: user._id });
      } catch (spErr) {
        console.warn('Notice creating student profile for Google user:', spErr.message);
      }
      isNewUser = true;
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact support.' });
    }

    const token = generateToken(user._id, user.email);
    const displayName = user.fullName || user.name;
    return res.status(200).json({
      success: true,
      message: isNewUser ? 'Account created with Google!' : 'Login successful!',
      token,
      user: {
        _id: user._id,
        name: displayName,
        fullName: displayName,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto || picture,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Google OAuth Verify Error]:', error);
    if (error.message && error.message.includes('Token used too late')) {
      return res.status(401).json({ success: false, message: 'Google token expired. Please try again.' });
    }
    return res.status(500).json({ success: false, message: error.message || 'Google authentication failed' });
  }
};
