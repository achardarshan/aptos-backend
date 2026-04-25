// server.js — Main Express server entry point for Aptos
const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
const clientBuildPath = path.join(__dirname, 'client', 'dist');
const legacyFrontendPath = path.join(__dirname, 'frontend');
const reactBuildExists = fs.existsSync(path.join(clientBuildPath, 'index.html'));
const publicPath = reactBuildExists ? clientBuildPath : legacyFrontendPath;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());
app.use(express.static(publicPath));

const sendFrontendApp = (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
};

// ─── Frontend Root ────────────────────────────────────────────────────────────
app.get('/', sendFrontendApp);

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/authRoutes'));
app.use('/api/visitors',   require('./routes/visitorRoutes'));
app.use('/api/staff',      require('./routes/staffRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/payments',   require('./routes/paymentRoutes'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Aptos API is running 🏠', timestamp: new Date() });
});

// ─── Seed Route — visit in browser to populate database ───────────────────────
app.get('/api/seed', async (req, res) => {
  try {
    const User      = require('./models/User');
    const Visitor   = require('./models/Visitor');
    const Staff     = require('./models/Staff');
    const Complaint = require('./models/Complaint');
    const Payment   = require('./models/Payment');

    // Clear all existing data
    await User.deleteMany({});
    await Visitor.deleteMany({});
    await Staff.deleteMany({});
    await Complaint.deleteMany({});
    await Payment.deleteMany({});

    // Create users (passwords hashed automatically by User model)
    const admin = await User.create({
      name: 'Rajesh Kumar', email: 'admin@aptos.com',
      password: 'admin123', role: 'admin', phone: '+91 9876543210', flatNumber: '',
    });
    const resident1 = await User.create({
      name: 'Priya Sharma', email: 'resident@aptos.com',
      password: 'resident123', role: 'resident', flatNumber: 'A-101', phone: '+91 9123456789',
    });
    const resident2 = await User.create({
      name: 'Amit Patel', email: 'amit@aptos.com',
      password: 'resident123', role: 'resident', flatNumber: 'B-202', phone: '+91 9234567890',
    });
    const resident3 = await User.create({
      name: 'Sunita Verma', email: 'sunita@aptos.com',
      password: 'resident123', role: 'resident', flatNumber: 'C-303', phone: '+91 9345678901',
    });
    const security = await User.create({
      name: 'Ramesh Guard', email: 'security@aptos.com',
      password: 'security123', role: 'security', flatNumber: '', phone: '+91 9456789012',
    });

    // Create visitors
    await Visitor.create({ name: 'Delivery Boy', phone: '9000011111', purpose: 'Package Delivery', flatNumber: 'A-101', status: 'pending', addedBy: security._id, entryTime: new Date() });
    await Visitor.create({ name: 'Deepak Mehta', phone: '9000022222', purpose: 'Personal Visit', flatNumber: 'B-202', status: 'approved', addedBy: security._id, approvedBy: resident2._id, entryTime: new Date(Date.now() - 2*60*60*1000) });
    await Visitor.create({ name: 'Plumber Raju', phone: '9000033333', purpose: 'Plumbing Work', flatNumber: 'C-303', status: 'approved', addedBy: security._id, approvedBy: resident3._id, entryTime: new Date(Date.now() - 3*60*60*1000), exitTime: new Date(Date.now() - 1*60*60*1000) });
    await Visitor.create({ name: 'Unknown Caller', phone: '9000044444', purpose: 'Unknown', flatNumber: 'A-101', status: 'rejected', addedBy: security._id, approvedBy: resident1._id, entryTime: new Date(Date.now() - 5*60*60*1000) });

    // Create staff with attendance
    const today     = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    await Staff.create({ name: 'Kamla Bai', type: 'maid', phone: '9100011111', flatNumber: 'A-101', addedBy: resident1._id, attendance: [{ date: yesterday, status: 'present', markedBy: resident1._id }, { date: today, status: 'present', markedBy: resident1._id }] });
    await Staff.create({ name: 'Ravi Cook', type: 'cook', phone: '9100022222', flatNumber: 'B-202', addedBy: resident2._id, attendance: [{ date: yesterday, status: 'absent', markedBy: resident2._id }, { date: today, status: 'present', markedBy: resident2._id }] });
    await Staff.create({ name: 'Mohan Driver', type: 'driver', phone: '9100033333', flatNumber: 'C-303', addedBy: resident3._id, attendance: [{ date: yesterday, status: 'present', markedBy: resident3._id }] });

    // Create complaints
    await Complaint.create({ title: 'Water leakage in bathroom', description: 'Constant water leak in the bathroom ceiling. Please send a plumber.', category: 'water', priority: 'high', status: 'in-progress', flatNumber: 'A-101', raisedBy: resident1._id, adminNote: 'Plumber scheduled for Saturday.' });
    await Complaint.create({ title: 'Street lights not working in Block B', description: 'Street lights near Block B parking have been off for 3 days.', category: 'electricity', priority: 'medium', status: 'pending', flatNumber: 'B-202', raisedBy: resident2._id });
    await Complaint.create({ title: 'Noisy neighbors at night', description: 'Loud music from C-304 late at night for 2 weeks.', category: 'noise', priority: 'medium', status: 'resolved', flatNumber: 'C-303', raisedBy: resident3._id, adminNote: 'Spoken to residents. Issue resolved.', resolvedAt: new Date() });
    await Complaint.create({ title: 'Garbage not collected for 3 days', description: 'Garbage bins near A block have not been emptied.', category: 'cleanliness', priority: 'high', status: 'pending', flatNumber: 'A-101', raisedBy: resident1._id });

    // Create payments
    const thisMonth = new Date().toISOString().slice(0, 7);
    const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
    await Payment.create({ title: `Maintenance Due – ${thisMonth}`, amount: 2500, dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 28), flatNumber: 'A-101', resident: resident1._id, createdBy: admin._id, month: thisMonth, status: 'unpaid' });
    await Payment.create({ title: `Maintenance Due – ${thisMonth}`, amount: 2500, dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 28), flatNumber: 'B-202', resident: resident2._id, createdBy: admin._id, month: thisMonth, status: 'paid', paidAt: new Date() });
    await Payment.create({ title: `Maintenance Due – ${thisMonth}`, amount: 2500, dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 28), flatNumber: 'C-303', resident: resident3._id, createdBy: admin._id, month: thisMonth, status: 'unpaid' });
    await Payment.create({ title: `Maintenance Due – ${lastMonth}`, amount: 2500, dueDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 28), flatNumber: 'A-101', resident: resident1._id, createdBy: admin._id, month: lastMonth, status: 'paid', paidAt: new Date(Date.now() - 15*24*60*60*1000) });

    // Add notifications
    await User.findByIdAndUpdate(resident1._id, { $push: { notifications: { $each: [
      { message: 'New visitor "Delivery Boy" at gate for Flat A-101', read: false },
      { message: 'Your complaint "Water leakage" is now in-progress.', read: false },
    ]}}});
    await User.findByIdAndUpdate(admin._id, { $push: { notifications: { $each: [
      { message: 'New complaint from Flat A-101: "Garbage not collected" (high priority)', read: false },
    ]}}});

    res.json({
      success: true,
      message: '🎉 Database seeded successfully! You can now log in.',
      credentials: {
        admin:    { email: 'admin@aptos.com',    password: 'admin123'    },
        resident: { email: 'resident@aptos.com', password: 'resident123' },
        security: { email: 'security@aptos.com', password: 'security123' },
      }
    });

  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Serve the frontend app for non-API routes.
app.get(/^\/(?!api).*/, sendFrontendApp);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong on the server' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Aptos server running on port ${PORT}`);
  console.log(`Visit /api/seed in browser to populate the database`);
  console.log(`Frontend served from ${reactBuildExists ? 'client/dist' : 'frontend'}`);
});
