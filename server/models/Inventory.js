import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  donationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation' },
  medicineName: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  expiryDate: { type: String, required: true },
  packageCondition: { type: String, default: 'Unopened/Sealed' },
}, { timestamps: true });

inventorySchema.virtual('dateAdded').get(function () {
  return this.createdAt.toISOString().split('T')[0];
});
inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

const Inventory = mongoose.model('Inventory', inventorySchema);
export default Inventory;
