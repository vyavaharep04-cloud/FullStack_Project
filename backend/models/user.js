import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone:    { type: String, default: '' },
  userId:   { type: String, unique: true },
  memberSince: { type: String },
  preferences: {
    defaultFilter:   { type: String, default: 'all' },
    startingBalance: { type: Number, default: 0 },
    theme:           { type: String, default: 'light' }
  },
  customIncomeCategories:  { type: [String], default: [] },
  customExpenseCategories: { type: [String], default: [] }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
