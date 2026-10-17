import mongoose from 'mongoose';

const answerAttemptSchema = new mongoose.Schema({
  questionIndex: {
    type: Number,
    required: true,
  },
  selectedOptionIndex: {
    type: Number,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
  marksObtained: {
    type: Number,
    default: 0,
  },
});

const courseQuizAttemptSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseQuiz',
      required: [true, 'Attempt must reference a quiz'],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseModule',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Attempt must belong to an authenticated student'],
    },
    answers: [answerAttemptSchema],
    totalScore: {
      type: Number,
      required: true,
      default: 0,
    },
    maxScore: {
      type: Number,
      required: true,
      default: 0,
    },
    percentage: {
      type: Number,
      required: true,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'course_quiz_attempts',
  }
);

courseQuizAttemptSchema.index({ quizId: 1, studentId: 1, courseId: 1 });

const CourseQuizAttempt =
  mongoose.models.CourseQuizAttempt ||
  mongoose.model('CourseQuizAttempt', courseQuizAttemptSchema);

export default CourseQuizAttempt;
