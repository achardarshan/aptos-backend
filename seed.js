// seed.js — Populate MongoDB with sample data for testing
// Run with: node seed.js (from the /backend directory)

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

// Import models
const User      = require('./models/User');
const Visitor   = require('./models/Visitor');
const Staff     = require('./models/Staff');
const Complaint = require('./models/Complaint');
const Payment   = require('./models/Payment');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany(),
      Visitor.deleteMany(),
      Staff.deleteMany(),
      Complaint.deleteMany(),
      Payment.deleteMany(),
    ]);
    console.log('🗑  Cleared existing data');

    // ── Create Users ──────────────────────────────────────────────────────────
    const adminPass    = await bcrypt.hash('admin123', 10);
    const residentPass = await bcrypt.hash('resident123', 10);
    const securityPass = await bcrypt.hash('security123', 10);

    const admin = await User.create({
      name: 'Rajan Mehta',
      email: 'admin@aptos.com',
      password: adminPass,
      role: 'admin',
      phone: '+91 9876543210',
      flatNumber: '',
    });

    const resident1 = await User.create({
      name: 'Priya Sharma',
      email: 'resident@aptos.com',
      password: residentPass,
      role: 'resident',
      flatNumber: 'A-101',
      phone: '+91 9876543211',
    });

    const resident2 = await User.create({
      name: 'Amit Patel',
      email: 'amit@aptos.com',
      password: residentPass,
      role: 'resident',
      flatNumber: 'B-202',
      phone: '+91 9876543212',
    });

    const resident3 = await User.create({
      name: 'Sunita Rao',
      email: 'sunita@aptos.com',
      password: residentPass,
      role: 'resident',
      flatNumber: 'C-303',
      phone: '+91 9876543213',
    });

    const security = await User.create({
      name: 'Ramesh Kumar',
      email: 'security@aptos.com',
      password: securityPass,
      role: 'security',
      phone: '+91 9876543214',
      flatNumber: '',
    });

    console.log('👤 Created 5 users (1 admin, 3 residents, 1 security)');

    // ── Create Visitors ───────────────────────────────────────────────────────
    const visitors = await Visitor.insertMany([
      {
        name: 'Delivery Boy - Swiggy',
        phone: '9123456780',
        purpose: 'Food Delivery',
        flatNumber: 'A-101',
        status: 'pending',
        addedBy: security._id,
        entryTime: new Date(),
      },
      {
        name: 'Plumber - Suresh',
        phone: '9123456781',
        purpose: 'Pipe repair',
        flatNumber: 'B-202',
        status: 'approved',
        addedBy: security._id,
        approvedBy: resident2._id,
        entryTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        exitTime: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        name: 'Kavya Nair',
        phone: '9123456782',
        purpose: 'Personal visit',
        flatNumber: 'A-101',
        status: 'approved',
        addedBy: security._id,
        approvedBy: resident1._id,
        entryTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
        exitTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        name: 'Amazon Courier',
        phone: '9123456783',
        purpose: 'Package delivery',
        flatNumber: 'C-303',
        status: 'rejected',
        addedBy: security._id,
        approvedBy: resident3._id,
        entryTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        name: 'Electrician - Vijay',
        phone: '9123456784',
        purpose: 'AC servicing',
        flatNumber: 'B-202',
        status: 'pending',
        addedBy: security._id,
        entryTime: new Date(),
      },
    ]);
    console.log(`🚶 Created ${visitors.length} visitor records`);

    // ── Create Staff ──────────────────────────────────────────────────────────
    const today = new Date().toISOString().split('T')[0];

    const staffMembers = await Staff.insertMany([
      {
        name: 'Lakshmi Devi',
        type: 'maid',
        phone: '9234567890',
        flatNumber: 'A-101',
        addedBy: resident1._id,
        attendance: [{ date: today, status: 'present', markedBy: resident1._id }],
      },
      {
        name: 'Ganesh Rao',
        type: 'cook',
        phone: '9234567891',
        flatNumber: 'B-202',
        addedBy: resident2._id,
        attendance: [{ date: today, status: 'absent', markedBy: resident2._id }],
      },
      {
        name: 'Mohan Das',
        type: 'driver',
        phone: '9234567892',
        flatNumber: 'A-101',
        addedBy: resident1._id,
        attendance: [],
      },
      {
        name: 'Radha Bai',
        type: 'maid',
        phone: '9234567893',
        flatNumber: 'C-303',
        addedBy: resident3._id,
        attendance: [{ date: today, status: 'present', markedBy: resident3._id }],
      },
    ]);
    console.log(`👷 Created ${staffMembers.length} staff members`);

    // ── Create Complaints ─────────────────────────────────────────────────────
    const complaints = await Complaint.insertMany([
      {
        title: 'Water leakage in corridor',
        description: 'There is a water leakage near the elevator on the 2nd floor. The floor gets very slippery.',
        category: 'water',
        priority: 'high',
        status: 'in-progress',
        raisedBy: resident1._id,
        flatNumber: 'A-101',
        adminNote: 'Plumber has been contacted and will visit tomorrow.',
      },
      {
        title: 'Street lights not working',
        description: 'The street lights near Gate B have not been working for the past 3 days. It feels unsafe at night.',
        category: 'electricity',
        priority: 'medium',
        status: 'pending',
        raisedBy: resident2._id,
        flatNumber: 'B-202',
      },
      {
        title: 'Garbage not collected',
        description: 'The garbage bin near C block has not been emptied for 2 days. It is creating a bad smell.',
        category: 'cleanliness',
        priority: 'medium',
        status: 'resolved',
        raisedBy: resident3._id,
        flatNumber: 'C-303',
        adminNote: 'Cleaning staff has been notified. Issue resolved.',
        resolvedAt: new Date(),
      },
      {
        title: 'Loud music at night',
        description: 'Flat D-404 plays very loud music after 11 PM on weekdays. This is disturbing sleep.',
        category: 'noise',
        priority: 'high',
        status: 'pending',
        raisedBy: resident1._id,
        flatNumber: 'A-101',
      },
    ]);
    console.log(`📋 Created ${complaints.length} complaints`);

    // ── Create Payments ───────────────────────────────────────────────────────
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const prevMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);

    const payments = await Payment.insertMany([
      // Current month — unpaid
      {
        title: 'Monthly Maintenance',
        amount: 2500,
        month: currentMonth,
        dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 10),
        flatNumber: 'A-101',
        resident: resident1._id,
        createdBy: admin._id,
        status: 'unpaid',
      },
      {
        title: 'Monthly Maintenance',
        amount: 2500,
        month: currentMonth,
        dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 10),
        flatNumber: 'B-202',
        resident: resident2._id,
        createdBy: admin._id,
        status: 'paid',
        paidAt: new Date(),
      },
      {
        title: 'Monthly Maintenance',
        amount: 2500,
        month: currentMonth,
        dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 10),
        flatNumber: 'C-303',
        resident: resident3._id,
        createdBy: admin._id,
        status: 'unpaid',
      },
      // Previous month — paid
      {
        title: 'Monthly Maintenance',
        amount: 2500,
        month: prevMonth,
        dueDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 10),
        flatNumber: 'A-101',
        resident: resident1._id,
        createdBy: admin._id,
        status: 'paid',
        paidAt: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      },
      // Special charges
      {
        title: 'Generator Maintenance Fund',
        amount: 500,
        month: currentMonth,
        dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 15),
        flatNumber: 'A-101',
        resident: resident1._id,
        createdBy: admin._id,
        status: 'unpaid',
      },
    ]);
    console.log(`💰 Created ${payments.length} payment records`);

    // ── Add notifications ─────────────────────────────────────────────────────
    await User.findByIdAndUpdate(resident1._id, {
      $push: {
        notifications: {
          message: 'New visitor "Delivery Boy - Swiggy" is waiting at the gate for Flat A-101.',
          read: false,
        },
      },
    });

    await User.findByIdAndUpdate(admin._id, {
      $push: {
        notifications: {
          message: 'New complaint from Flat A-101: "Water leakage in corridor" (high priority)',
          read: false,
        },
      },
    });

    console.log('🔔 Added sample notifications');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Login credentials:');
    console.log('   Admin:    admin@aptos.com    / admin123');
    console.log('   Resident: resident@aptos.com / resident123');
    console.log('   Security: security@aptos.com / security123');
    console.log('\n   Extra residents:');
    console.log('   Amit:     amit@aptos.com     / resident123  (Flat B-202)');
    console.log('   Sunita:   sunita@aptos.com   / resident123  (Flat C-303)');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
