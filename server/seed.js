import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from './db/mongoose.js';
import User from './models/User.js';
import Donation from './models/Donation.js';
import Inventory from './models/Inventory.js';
import Request from './models/Request.js';

const seed = async () => {
  await connectDB();

  console.log('🌱 Clearing existing data...');
  await User.deleteMany();
  await Donation.deleteMany();
  await Inventory.deleteMany();
  await Request.deleteMany();

  console.log('👤 Creating users...');
  const hash = async (p) => bcrypt.hash(p, 10);

  const [donor, verifier, charity, admin, camp] = await User.insertMany([
    { name: 'Sarah Jenkins',         email: 'donor@mrrs.org',    password: await hash('password'), role: 'donor',    phone: '+1 555-0199', verified: true },
    { name: 'Dr. Robert Chen',       email: 'verifier@mrrs.org', password: await hash('password'), role: 'verifier', department: 'Quality Control', verified: true },
    { name: 'Hope Care Free Clinic', email: 'charity@mrrs.org',  password: await hash('password'), role: 'charity',  type: 'Charity Hospital', address: '789 Health Ave', contactPerson: 'Mary Robbins', verified: true },
    { name: 'Alex Mercer',           email: 'admin@mrrs.org',    password: await hash('password'), role: 'admin',    department: 'Super Admin', verified: true },
    { name: 'Red Cross Medical Camp',email: 'camp@mrrs.org',     password: await hash('password'), role: 'charity',  type: 'Free Medical Camp', address: '456 Outreach Rd', contactPerson: 'John Davis', verified: false },
  ]);

  console.log('💊 Creating donations...');
  const d1 = await Donation.create({ medicineName: 'Amoxicillin 500mg', category: 'Antibiotics', quantity: 30, expiryDate: '2026-11-30', packageCondition: 'Unopened/Sealed', pickupPreference: 'Pickup Requested', donorName: donor.name, donorEmail: donor.email, status: 'Approved', verifiedBy: verifier.name });
  const d2 = await Donation.create({ medicineName: 'Metformin 850mg',   category: 'Diabetes',    quantity: 60, expiryDate: '2027-08-15', packageCondition: 'Unopened/Sealed', pickupPreference: 'Drop-off',          donorName: donor.name, donorEmail: donor.email, status: 'Pending' });
  const d3 = await Donation.create({ medicineName: 'Atorvastatin 20mg', category: 'Cholesterol', quantity: 90, expiryDate: '2026-02-01', packageCondition: 'Opened Box',      pickupPreference: 'Pickup Requested', donorName: 'Emily Watson', donorEmail: 'emily@gmail.com', status: 'Rejected', rejectionReason: 'Expiry date is too close and package is opened.', verifiedBy: verifier.name });
  const d4 = await Donation.create({ medicineName: 'Paracetamol 500mg', category: 'Analgesics',  quantity: 100,expiryDate: '2027-01-20', packageCondition: 'Unopened/Sealed', pickupPreference: 'Drop-off',          donorName: 'Emily Watson', donorEmail: 'emily@gmail.com', status: 'Approved', verifiedBy: verifier.name });
  const d5 = await Donation.create({ medicineName: 'Lisinopril 10mg',   category: 'Cardiac',     quantity: 50, expiryDate: '2027-09-30', packageCondition: 'Unopened/Sealed', pickupPreference: 'Pickup Requested', donorName: donor.name, donorEmail: donor.email, status: 'Approved', verifiedBy: verifier.name });

  console.log('📦 Creating inventory...');
  const inv1 = await Inventory.create({ donationId: d1._id, medicineName: 'Amoxicillin 500mg', category: 'Antibiotics', quantity: 30, expiryDate: '2026-11-30', packageCondition: 'Unopened/Sealed' });
  const inv2 = await Inventory.create({ donationId: d4._id, medicineName: 'Paracetamol 500mg', category: 'Analgesics',  quantity: 60, expiryDate: '2027-01-20', packageCondition: 'Unopened/Sealed' });
  const inv3 = await Inventory.create({ donationId: d5._id, medicineName: 'Lisinopril 10mg',   category: 'Cardiac',     quantity: 50, expiryDate: '2027-09-30', packageCondition: 'Unopened/Sealed' });

  console.log('📋 Creating requests...');
  await Request.create({ inventoryId: inv2._id, medicineName: 'Paracetamol 500mg', category: 'Analgesics', quantity: 40, charityName: charity.name, charityEmail: charity.email, status: 'Delivered', dateUpdated: '2026-06-07' });
  await Request.create({ inventoryId: inv3._id, medicineName: 'Lisinopril 10mg',   category: 'Cardiac',    quantity: 15, charityName: charity.name, charityEmail: charity.email, status: 'Pending' });

  console.log('✅ Database seeded successfully!');
  mongoose.connection.close();
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  mongoose.connection.close();
  process.exit(1);
});
