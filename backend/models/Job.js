import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    companyName: {
      type: String,
      default: 'Hiring Partner',
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      default: 'Remote',
      trim: true,
    },
    employmentType: {
      type: String,
      default: 'Full-time',
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    experienceRequired: {
      type: String,
      default: '',
      trim: true,
    },
    salaryRange: {
      type: String,
      default: '',
      trim: true,
    },
    education: {
      type: String,
      default: '',
      trim: true,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    preferredSkills: {
      type: [String],
      default: [],
    },
    jdFileName: {
      type: String,
      default: '',
      trim: true,
    },
    jdFileBase64: {
      type: String,
      default: '',
    },
    jdMimeType: {
      type: String,
      default: 'application/pdf',
      trim: true,
    },
    deadline: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['Active', 'Draft', 'Closed', 'Deactivated'],
      default: 'Active',
    },
    applicationsCount: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'job_postings', // Dedicated MongoDB Collection for Post a Job section
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);
export default Job;
