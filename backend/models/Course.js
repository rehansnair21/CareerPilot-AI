import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  duration: {
    type: String,
    default: '',
    trim: true,
  },
  contentUrl: {
    type: String,
    default: '',
    trim: true,
  },
});

const courseSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor',
      required: [true, 'Course must belong to a mentor'],
    },
    title: {
      type: String,
      required: [true, 'Please provide a course title'],
      trim: true,
    },
    shortDescription: {
      type: String,
      default: '',
      trim: true,
    },
    detailedDescription: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    thumbnail: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'Software Development',
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    learningObjectives: {
      type: [String],
      default: [],
    },
    prerequisites: {
      type: [String],
      default: [],
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
      default: 'All Levels',
    },
    duration: {
      type: String,
      default: '4 Weeks',
      trim: true,
    },
    language: {
      type: String,
      default: 'English',
      trim: true,
    },
    priceType: {
      type: String,
      enum: ['Free', 'Paid'],
      default: 'Free',
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    lessons: {
      type: [lessonSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['published', 'draft', 'deactivated'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
    collection: 'courses',
  }
);

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);
export default Course;
