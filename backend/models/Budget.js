import mongoose from 'mongoose';

const budgetCategorySchema = new mongoose.Schema({
  category: { type: String, required: true, trim: true },
  emoji:    { type: String, default: '💰' },
  limit:    { type: Number, required: true, min: 0 }
}, { _id: false });

const budgetSchema = new mongoose.Schema({
  user:  {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
    required: true,
    index: true
  },
  year:  { type: Number, required: true },
  month: { type: Number, required: true, min: 1, max: 12 },  // 1–12
  monthlyCap: { type: Number, default: 0 },
  categories: { type: [budgetCategorySchema], default: [] }
}, { timestamps: true });

// One budget doc per user per month
budgetSchema.index({ user: 1, year: 1, month: 1 }, { unique: true });

export default mongoose.model('Budget', budgetSchema);