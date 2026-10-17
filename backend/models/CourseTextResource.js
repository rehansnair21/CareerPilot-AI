import mongoose from 'mongoose';

const courseTextResourceSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Text resource must belong to a specific course'],
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseModule',
      required: [true, 'Text resource must belong to a specific module'],
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseLesson',
      default: null,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Text resource must belong to a mentor'],
    },
    title: {
      type: String,
      required: [true, 'Please provide a resource title'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Please specify resource type'],
      enum: ['article', 'documentation', 'practice_website', 'reference_link', 'note', 'assignment'],
      default: 'reference_link',
    },
    url: {
      type: String,
      default: '',
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'course_text_resources',
  }
);

courseTextResourceSchema.index({ courseId: 1, moduleId: 1, mentorId: 1 });

const CourseTextResource =
  mongoose.models.CourseTextResource ||
  mongoose.model('CourseTextResource', courseTextResourceSchema);

export default CourseTextResource;
