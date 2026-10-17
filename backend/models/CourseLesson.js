import mongoose from 'mongoose';

const courseLessonSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Lesson must belong to a specific course'],
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseModule',
      required: [true, 'Lesson must belong to a specific module'],
    },
    title: {
      type: String,
      required: [true, 'Please provide a lesson title'],
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    duration: {
      type: String,
      default: '10 min',
      trim: true,
    },
    order: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
    collection: 'course_lessons',
  }
);

// Index for fast query of lessons by courseId, moduleId, and order
courseLessonSchema.index({ courseId: 1, moduleId: 1, order: 1 });

const CourseLesson = mongoose.models.CourseLesson || mongoose.model('CourseLesson', courseLessonSchema);
export default CourseLesson;
