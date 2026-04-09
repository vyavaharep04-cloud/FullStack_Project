import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['Income', 'Expense'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  emoji: {
    type: String,
    default: '💰'
  },
  date: {
    type: String,      // stored as "YYYY-MM-DD" — matches frontend format
    required: true
  },
  payment: {
    type: String,
    trim: true,
    default: ''
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, { timestamps: true });

// Index for fast per-user queries sorted by date
transactionSchema.index({ user: 1, date: -1 });

export default mongoose.model('Transaction', transactionSchema);