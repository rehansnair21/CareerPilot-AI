import mongoose from 'mongoose';

const softSkillAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      default: 'Communication & Active Listening',
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    questions: [
      {
        id: { type: String },
        scenario: { type: String, required: true },
        context: { type: String },
        options: [
          {
            id: { type: String, required: true },
            text: { type: String, required: true },
            description: { type: String },
          },
        ],
        selectedOptionId: { type: String },
      },
    ],
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    skillScores: {
      communication: { type: Number, default: 0 },
      problemSolving: { type: Number, default: 0 },
      leadership: { type: Number, default: 0 },
      adaptability: { type: Number, default: 0 },
      emotionalIntelligence: { type: Number, default: 0 },
    },
    aiFeedback: {
      summary: { type: String, default: '' },
      strengths: [{ type: String }],
      areasToImprove: [{ type: String }],
      recommendations: [{ type: String }],
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const SoftSkillAttempt = mongoose.model('SoftSkillAttempt', softSkillAttemptSchema);

export default SoftSkillAttempt;
