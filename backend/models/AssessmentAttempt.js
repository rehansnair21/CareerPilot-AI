import mongoose from 'mongoose';

const assessmentAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    language: {
      type: String,
      required: true,
      enum: ['JavaScript', 'Python', 'Java', 'C++'],
      default: 'JavaScript',
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    question: {
      title: { type: String, required: true },
      difficulty: { type: String, required: true },
      description: { type: String, required: true },
      inputFormat: { type: String, default: '' },
      outputFormat: { type: String, default: '' },
      constraints: { type: String, default: '' },
      exampleInput: { type: String, default: '' },
      exampleOutput: { type: String, default: '' },
      skillsTested: [{ type: String }],
      starterCode: { type: String, default: '' },
      testCases: [
        {
          input: { type: String, required: true },
          expectedOutput: { type: String, required: true },
          isSecret: { type: Boolean, default: false },
        },
      ],
    },
    submittedCode: {
      type: String,
      required: true,
    },
    testResults: {
      totalTestCases: { type: Number, default: 0 },
      passedTestCases: { type: Number, default: 0 },
      failedTestCases: { type: Number, default: 0 },
      executionTimeMs: { type: Number, default: 0 },
      details: [
        {
          testCaseIndex: { type: Number },
          passed: { type: Boolean },
          input: { type: String },
          expectedOutput: { type: String },
          actualOutput: { type: String },
          error: { type: String, default: '' },
        },
      ],
      error: { type: String, default: '' },
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    skillScores: {
      codeQuality: { type: Number, default: 0 },
      problemSolving: { type: Number, default: 0 },
      testCorrectness: { type: Number, default: 0 },
    },
    aiFeedback: {
      strengths: [{ type: String }],
      areasToImprove: [{ type: String }],
      feedbackText: { type: String, default: '' },
      timeComplexity: { type: String, default: 'O(N)' },
      spaceComplexity: { type: String, default: 'O(1)' },
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

const AssessmentAttempt = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);

export default AssessmentAttempt;
