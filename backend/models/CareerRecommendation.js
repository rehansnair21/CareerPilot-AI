import mongoose from 'mongoose';

const recommendationItemSchema = new mongoose.Schema(
  {
    careerTitle: {
      type: String,
      required: [true, 'Career title is required'],
      trim: true,
    },
    matchPercentage: {
      type: Number,
      required: [true, 'Match percentage is required'],
      min: 0,
      max: 100,
    },
    matchingSkills: [{ type: String }],
    skillGaps: [{ type: String }],
    reason: {
      type: String,
      default: '',
    },
    recommendedImprovements: [{ type: String }],
    salaryRange: {
      type: String,
      default: '',
    },
    growthProspects: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const careerRecommendationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    topMatch: {
      careerTitle: { type: String, default: '' },
      matchPercentage: { type: Number, default: 0 },
      matchingSkills: [{ type: String }],
    },
    recommendations: [recommendationItemSchema],
    inputSnapshot: {
      technicalSkills: [{ type: String }],
      softSkills: [{ type: String }],
      degree: { type: String, default: '' },
      specialization: { type: String, default: '' },
      targetCareer: { type: String, default: '' },
      preferredJobRole: { type: String, default: '' },
      resumeScore: { type: Number, default: null },
      assessmentScore: { type: Number, default: null },
      portfolioScore: { type: Number, default: null },
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'career_recommendations',
    timestamps: true,
  }
);

// Compound index for querying active recommendation per user quickly
careerRecommendationSchema.index({ user: 1, status: 1, createdAt: -1 });

const CareerRecommendation = mongoose.model(
  'CareerRecommendation',
  careerRecommendationSchema,
  'career_recommendations'
);

export default CareerRecommendation;
