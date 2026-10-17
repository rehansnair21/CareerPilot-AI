import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'userModel',
      required: [true, 'Notification must belong to a user'],
    },
    userModel: {
      type: String,
      enum: ['User', 'Mentor'],
      default: 'User',
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'senderModel',
      default: null,
    },
    senderModel: {
      type: String,
      enum: ['User', 'Mentor'],
      default: 'User',
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    type: {
      type: String,
      enum: ['mentor_message', 'mentor_reply', 'course_progress', 'assignment', 'quiz', 'system'],
      default: 'mentor_message',
    },
    link: {
      type: String,
      default: '',
      trim: true,
    },
    relatedCourseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
    },
    relatedMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'notifications',
  }
);

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;
