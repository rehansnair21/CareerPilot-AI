import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // Personal Information
    phone: { type: String, default: '' },
    profilePhoto: { type: String, default: '' },

    // Academic Information
    college: { type: String, default: '' },
    degree: { type: String, default: '' },
    specialization: { type: String, default: '' },
    graduationYear: { type: String, default: '' },
    cgpa: { type: String, default: '' },

    // Career Information
    targetCareer: { type: String, default: '' },
    preferredJobRole: { type: String, default: '' },
    careerInterests: { type: String, default: '' },

    // Skills & Expertise
    technicalSkills: { type: [String], default: [] },
    softSkills: { type: [String], default: [] },

    // Professional Links
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    portfolio: { type: String, default: '' },

    // Calculated Profile Completion Percentage (0 - 100)
    profileCompletion: { type: Number, default: 0 },

    // Dynamic Student Stats
    resumeScore: { type: Number, default: null },
    resumeUrl: { type: String, default: '' },
    assessmentScore: { type: Number, default: null },
    assessmentsCompleted: { type: Number, default: 0 },
    careerMatch: { type: Number, default: null },
    careerMatchTitle: { type: String, default: '' },
    learningProgress: { type: Number, default: 0 },
    completedModules: { type: Number, default: 0 },
    totalModules: { type: Number, default: 0 },
    projectsCompleted: { type: Number, default: 0 },

    // Detailed Resume Analysis
    resumeAnalysis: {
      analyzedAt: { type: Date, default: null },
      fileName: { type: String, default: '' },
      fileSize: { type: String, default: '' },
      targetRole: { type: String, default: '' },
      atsScore: { type: Number, default: 0 },
      atsCompatibility: { type: String, default: '' },
      summary: { type: String, default: '' },
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
      suggestedBulletRewrites: [
        {
          original: { type: String },
          improved: { type: String },
          reason: { type: String },
        },
      ],
    },

    // Student Activity Log
    activities: [
      {
        title: { type: String, required: true },
        desc: { type: String, default: '' },
        time: { type: String, default: 'Just now' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { collection: 'student_profile', timestamps: true }
);

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
export default StudentProfile;
