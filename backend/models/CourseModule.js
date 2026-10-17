import mongoose from 'mongoose';

const courseModuleSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Module must belong to a specific course'],
    },
    title: {
      type: String,
      required: [true, 'Please provide a module title'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    order: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
    collection: 'course_modules',
  }
);

// Index for fast query of modules by courseId and order
courseModuleSchema.index({ courseId: 1, order: 1 });

const CourseModule = mongoose.models.CourseModule || mongoose.model('CourseModule', courseModuleSchema);
export default CourseModule;
