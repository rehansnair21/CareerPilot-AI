import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
  },
  options: {
    type: [String],
    validate: {
      validator: function (val) {
        return Array.isArray(val) && val.length >= 2;
      },
      message: 'Question must have at least 2 options',
    },
    required: true,
  },
  correctOptionIndex: {
    type: Number,
    required: [true, 'Correct option index is required'],
    default: 0,
  },
  explanation: {
    type: String,
    default: '',
    trim: true,
  },
  marks: {
    type: Number,
    default: 1,
    min: [1, 'Marks must be at least 1'],
  },
});

const courseQuizSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Quiz must belong to a specific course'],
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseModule',
      required: [true, 'Quiz must belong to a specific module'],
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Quiz must belong to a mentor'],
    },
    title: {
      type: String,
      required: [true, 'Please provide a quiz title'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    questions: {
      type: [questionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'course_quizzes',
  }
);

courseQuizSchema.index({ courseId: 1, moduleId: 1, mentorId: 1 });

const CourseQuiz =
  mongoose.models.CourseQuiz || mongoose.model('CourseQuiz', courseQuizSchema);

export default CourseQuiz;
