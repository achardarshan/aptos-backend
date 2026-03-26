// models/Visitor.js — Visitor management schema
const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Visitor name is required'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
  },
  purpose: {
    type: String,
    required: [true, 'Purpose of visit is required'],
  },
  flatNumber: {
    type: String,
    required: [true, 'Flat number is required'],
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  entryTime: {
    type: Date,
    default: null,
  },
  exitTime: {
    type: Date,
    default: null,
  },
  // Security guard who registered this visitor
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Resident who approved or rejected
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  photo: {
    type: String,
    default: '', // URL or base64 (optional)
  },
}, { timestamps: true });

module.exports = mongoose.model('Visitor', visitorSchema);
