import mongoose from 'mongoose';

const portfolioAnalysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    portfolioUrl: {
      type: String,
      required: [true, 'Portfolio URL is required'],
      trim: true,
    },
    targetRole: {
      type: String,
      default: 'Software Engineer',
    },
    overallScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    overallReview: {
      type: String,
      default: '',
    },
    ratingBreakdown: {
      designAndUx: { type: Number, default: 0 },
      projectShowcase: { type: Number, default: 0 },
      technicalDepth: { type: Number, default: 0 },
      contentClarity: { type: Number, default: 0 },
    },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    recommendations: [{ type: String }],
    detectedSkills: [{ type: String }],
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
    collection: 'portfolio_analyses',
    timestamps: true,
  }
);

// Compound index for querying active portfolio analysis per user quickly
portfolioAnalysisSchema.index({ user: 1, status: 1, createdAt: -1 });

const PortfolioAnalysis = mongoose.model(
  'PortfolioAnalysis',
  portfolioAnalysisSchema,
  'portfolio_analyses'
);

export default PortfolioAnalysis;
