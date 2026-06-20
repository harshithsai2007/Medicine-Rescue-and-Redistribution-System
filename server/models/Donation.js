import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  medicineName: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['Antibiotics', 'Analgesics', 'Diabetes', 'Cardiac', 'Cholesterol', 'Pediatrics', 'Other'],
    required: true
  },
  quantity: { type: Number, required: true, min: 1 },
  expiryDate: { type: String, required: true },
  packageCondition: {
    type: String,
    enum: ['Unopened/Sealed', 'Opened Box'],
    required: true
  },
  pickupPreference: {
    type: String,
    enum: ['Drop-off', 'Pickup Requested'],
    default: 'Drop-off'
  },
  notes: { type: String, default: '' },
  donorName: { type: String, required: true },
  donorEmail: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  rejectionReason: { type: String, default: '' },
  verifiedBy: { type: String, default: '' },
}, { timestamps: true });

// Virtual for dateAdded
donationSchema.virtual('dateAdded').get(function () {
  return this.createdAt.toISOString().split('T')[0];
});

donationSchema.set('toJSON', { virtuals: true });
donationSchema.set('toObject', { virtuals: true });

const Donation = mongoose.model('Donation', donationSchema);
export default Donation;
