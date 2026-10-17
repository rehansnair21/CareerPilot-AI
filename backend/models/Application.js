import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentProfile',
      default: null,
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['New', 'Reviewing', 'Shortlisted', 'Interview', 'Selected', 'Rejected'],
      default: 'New',
    },
    applicantName: {
      type: String,
      default: '',
    },
    applicantEmail: {
      type: String,
      default: '',
    },
    applicantPhone: {
      type: String,
      default: '',
    },
    degree: {
      type: String,
      default: '',
    },
    institution: {
      type: String,
      default: '',
    },
    graduationYear: {
      type: String,
      default: '',
    },
    skills: [
      {
        type: String,
      },
    ],
    experienceType: {
      type: String,
      enum: ['Fresher', 'Experienced'],
      default: 'Fresher',
    },
    experienceDetails: {
      type: String,
      default: 'Fresher',
    },
    resumeFileName: {
      type: String,
      default: '',
    },
    resumeFileBuffer: {
      type: Buffer,
      default: null,
    },
    resumeMimeType: {
      type: String,
      default: 'application/pdf',
    },
    coverNote: {
      type: String,
      default: '',
    },
    matchScore: {
      type: Number,
      default: 85,
    },
  },
  {
    timestamps: true,
    collection: 'applications',
  }
);

const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);
export default Application;
