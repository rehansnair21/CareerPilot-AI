import mongoose from 'mongoose';

const courseProgressSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Progress must belong to a student'],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Progress must reference a course'],
    },
    completedLessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseLesson',
      },
    ],
    completedModules: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseModule',
      },
    ],
    completedPDFs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CoursePDFResource',
      },
    ],
    completedResources: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseTextResource',
      },
    ],
    completedQuizzes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseQuiz',
      },
    ],
    completedAssignments: [
      {
        resourceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'CourseTextResource',
        },
        submissionText: { type: String, default: '' },
        submissionUrl: { type: String, default: '' },
        completedAt: { type: Date, default: Date.now },
      },
    ],
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'course_progress',
  }
);

courseProgressSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

const CourseProgress =
  mongoose.models.CourseProgress || mongoose.model('CourseProgress', courseProgressSchema);

export default CourseProgress;
