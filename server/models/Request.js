import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
  medicineName: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  charityName: { type: String, required: true },
  charityEmail: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Delivered'],
    default: 'Pending'
  },
  dateUpdated: { type: String, default: '' },
}, { timestamps: true });

requestSchema.virtual('dateRequested').get(function () {
  return this.createdAt.toISOString().split('T')[0];
});
requestSchema.set('toJSON', { virtuals: true });
requestSchema.set('toObject', { virtuals: true });

const Request = mongoose.model('Request', requestSchema);
export default Request;
