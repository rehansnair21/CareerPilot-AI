import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const recruiterSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    fullName: {
      type: String,
      required: [true, 'Please provide a full name'],
      trim: true,
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false,
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    role: {
      type: String,
      default: 'recruiter',
    },
    companyName: {
      type: String,
      default: '',
      trim: true,
    },
    companyWebsite: {
      type: String,
      default: '',
      trim: true,
    },
    industry: {
      type: String,
      default: '',
      trim: true,
    },
    companyDescription: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    designation: {
      type: String,
      default: '',
      trim: true,
    },
    jobsPostedCount: {
      type: Number,
      default: 0,
    },
    verifiedStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'verified',
    },
    googleId: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'recruiters', // MongoDB collection name
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual property 'name' so frontend code accesses recruiter.name seamlessly
recruiterSchema.virtual('name')
  .get(function () {
    return this.fullName;
  })
  .set(function (name) {
    this.fullName = name;
  });

// Encrypt password using bcrypt before saving
recruiterSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match recruiter entered password to hashed password in database
recruiterSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const Recruiter = mongoose.models.Recruiter || mongoose.model('Recruiter', recruiterSchema);
export default Recruiter;
