import mongoose from 'mongoose';

const assessmentScoreSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    overallScore: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    codeQualityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    problemSolvingScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    testCorrectnessScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    assessmentsCompleted: {
      type: Number,
      default: 0,
    },
    highestScore: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
    lastAssessmentLanguage: {
      type: String,
      default: 'JavaScript',
    },
    lastAssessmentDifficulty: {
      type: String,
      default: 'Beginner',
    },
    lastCompletedAt: {
      type: Date,
      default: Date.now,
    },
    latestAttempt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssessmentAttempt',
    },
  },
  {
    timestamps: true,
  }
);

const AssessmentScore = mongoose.model('AssessmentScore', assessmentScoreSchema, 'assessmentscores');

export default AssessmentScore;

