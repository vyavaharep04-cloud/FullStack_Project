import mongoose from 'mongoose';

const contributionSchema = new mongoose.Schema({
  id:     { type: Number, required: true },
  amount: { type: Number, required: true, min: 0 },
  date:   { type: String, required: true },   // "YYYY-MM-DD" — matches frontend
  note:   { type: String, default: '' }
}, { _id: false });

const savingsGoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  goalName:       { type: String, required: true, trim: true },
  targetAmount:   { type: Number, required: true, min: 0 },
  savedAmount:    { type: Number, default: 0, min: 0 },
  deadline:       { type: String, required: true },   // "YYYY-MM-DD"
  emoji:          { type: String, default: '🎯' },
  priority:       { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  statusOverride: { type: String, default: 'auto' },
  createdAt_str:  { type: String },                   // "YYYY-MM-DD" — frontend createdAt
  contributions:  { type: [contributionSchema], default: [] }
}, { timestamps: true });

savingsGoalSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('SavingsGoal', savingsGoalSchema);