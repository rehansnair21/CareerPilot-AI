import mongoose from 'mongoose';

const suggestedRewriteSchema = new mongoose.Schema(
  {
    original: { type: String, default: '' },
    improved: { type: String, default: '' },
    reason: { type: String, default: '' },
  },
  { _id: false }
);

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    fileName: {
      type: String,
      default: '',
    },
    fileSize: {
      type: String,
      default: '',
    },
    fileBuffer: {
      type: Buffer,
      default: null,
    },
    fileMimeType: {
      type: String,
      default: 'application/pdf',
    },
    targetRole: {
      type: String,
      default: 'Software Engineer',
    },
    atsScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    atsCompatibility: {
      type: String,
      default: '',
    },
    summary: {
      type: String,
      default: '',
    },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    improvements: [{ type: String }],
    detectedSkills: [{ type: String }],
    missingKeywords: [{ type: String }],
    sectionScores: {
      formatting: { type: Number, default: 0 },
      skillsMatch: { type: Number, default: 0 },
      experienceImpact: { type: Number, default: 0 },
      education: { type: Number, default: 0 },
    },
    suggestedBulletRewrites: [suggestedRewriteSchema],
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true,
    },
    analyzedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'resumes',
    timestamps: true,
  }
);

// Compound index for querying active resume per user quickly
resumeSchema.index({ user: 1, status: 1, createdAt: -1 });

const Resume = mongoose.model('Resume', resumeSchema, 'resumes');

export default Resume;
