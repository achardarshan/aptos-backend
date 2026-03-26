// models/Staff.js — Domestic staff management schema
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    required: true,
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  markedAt: {
    type: Date,
    default: Date.now,
  },
});

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Staff name is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['maid', 'cook', 'driver', 'gardener', 'watchman', 'other'],
    required: [true, 'Staff type is required'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
  },
  flatNumber: {
    type: String,
    required: [true, 'Flat number is required'],
  },
  // Resident who added this staff member
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  attendance: [attendanceSchema], // Array of daily attendance records
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);
