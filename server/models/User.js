import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['donor', 'verifier', 'charity', 'admin'],
    required: true
  },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  // Charity-specific fields
  type: {
    type: String,
    enum: ['Charity Hospital', 'Healthcare NGO', 'Free Medical Camp', ''],
    default: ''
  },
  contactPerson: { type: String, default: '' },
  verified: { type: Boolean, default: false },
  department: { type: String, default: '' },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
