// models/Payment.js — Maintenance payment tracking schema
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Payment title is required'], // e.g. "March 2024 Maintenance"
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0,
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
  },
  flatNumber: {
    type: String,
    required: [true, 'Flat number is required'],
  },
  // Resident who needs to pay
  resident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid',
  },
  paidAt: {
    type: Date,
    default: null,
  },
  // Admin who created this due
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  month: {
    type: String, // e.g. "2024-03"
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
