import mongoose from 'mongoose';

const careerRoadmapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    careerTitle: {
      type: String,
      required: [true, 'Career title is required'],
      trim: true,
    },
    matchPercentage: {
      type: Number,
      default: 85,
      min: 0,
      max: 100,
    },
    matchingSkills: [{ type: String }],
    skillGaps: [{ type: String }],
    phases: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    recommendedResources: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    milestonesList: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    completedMilestones: [{ type: String }],
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    aiTip: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active',
      index: true,
    },
  },
  {
    collection: 'career_roadmaps',
    timestamps: true,
  }
);

// Compound index for querying active roadmap per user quickly
careerRoadmapSchema.index({ user: 1, status: 1, createdAt: -1 });

const CareerRoadmap = mongoose.model('CareerRoadmap', careerRoadmapSchema, 'career_roadmaps');

export default CareerRoadmap;
