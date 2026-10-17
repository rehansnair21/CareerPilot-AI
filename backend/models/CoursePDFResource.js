import mongoose from 'mongoose';

const coursePDFResourceSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'PDF resource must belong to a specific course'],
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseModule',
      required: [true, 'PDF resource must belong to a specific module'],
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseLesson',
      default: null,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor',
      required: [true, 'PDF resource must belong to a mentor'],
    },
    title: {
      type: String,
      required: [true, 'Please provide a PDF title'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    filePath: {
      type: String,
      required: [true, 'File path reference is required'],
    },
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    fileData: {
      type: String,
      default: '',
      select: false,
    },
  },
  {
    timestamps: true,
    collection: 'course_pdf_resources',
  }
);

coursePDFResourceSchema.index({ courseId: 1, moduleId: 1, mentorId: 1 });

const CoursePDFResource =
  mongoose.models.CoursePDFResource ||
  mongoose.model('CoursePDFResource', coursePDFResourceSchema);

export default CoursePDFResource;
