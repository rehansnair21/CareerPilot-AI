import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Payment must belong to a student'],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Payment must reference a course'],
    },
    orderId: {
      type: String,
      required: [true, 'Razorpay orderId is required'],
      trim: true,
    },
    paymentId: {
      type: String,
      required: [true, 'Razorpay paymentId is required'],
      trim: true,
    },
    razorpaySignature: {
      type: String,
      default: '',
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'completed', 'failed', 'pending'],
      default: 'paid',
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'payments',
  }
);

paymentSchema.index({ studentId: 1, courseId: 1 });
paymentSchema.index({ paymentId: 1 }, { unique: true });

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export default Payment;
