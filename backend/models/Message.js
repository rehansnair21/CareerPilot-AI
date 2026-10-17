import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'senderModel',
      required: [true, 'Message must have a sender'],
    },
    senderModel: {
      type: String,
      enum: ['User', 'Mentor'],
      default: 'User',
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'recipientModel',
      required: [true, 'Message must have a recipient'],
    },
    recipientModel: {
      type: String,
      enum: ['User', 'Mentor'],
      default: 'User',
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Message must reference a course'],
    },
    subject: {
      type: String,
      required: [true, 'Please provide a message subject'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    body: {
      type: String,
      required: [true, 'Please provide a message body'],
      trim: true,
      maxlength: [3000, 'Message body cannot exceed 3000 characters'],
    },
    messageType: {
      type: String,
      enum: ['mentor_intervention', 'student_reply', 'general'],
      default: 'mentor_intervention',
    },
    templateKey: {
      type: String,
      enum: ['low_progress', 'inactive', 'encouragement', 'custom'],
      default: 'custom',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    parentMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'messages',
  }
);

messageSchema.index({ recipientId: 1, isRead: 1 });
messageSchema.index({ senderId: 1, recipientId: 1, courseId: 1 });
messageSchema.index({ parentMessageId: 1 });

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

export default Message;
