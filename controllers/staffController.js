// controllers/staffController.js — Domestic staff CRUD and attendance
const Staff = require('../models/Staff');

// @desc    Add new staff member
// @route   POST /api/staff
// @access  Private/Resident/Admin
const addStaff = async (req, res) => {
  try {
    const { name, type, phone, flatNumber } = req.body;

    const staff = await Staff.create({
      name,
      type,
      phone,
      flatNumber: flatNumber || req.user.flatNumber,
      addedBy: req.user.id,
    });

    res.status(201).json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all staff
// @route   GET /api/staff
// @access  Private
const getStaff = async (req, res) => {
  try {
    let query = {};

    // Residents only see staff for their flat
    if (req.user.role === 'resident') {
      query.flatNumber = req.user.flatNumber;
    }

    const staff = await Staff.find(query)
      .populate('addedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: staff.length, staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single staff member
// @route   GET /api/staff/:id
// @access  Private
const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).populate('addedBy', 'name');

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }

    res.json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark attendance for a staff member
// @route   POST /api/staff/:id/attendance
// @access  Private/Resident/Admin
const markAttendance = async (req, res) => {
  try {
    const { date, status } = req.body;
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }

    // Check if attendance already marked for this date
    const existing = staff.attendance.find((a) => a.date === date);
    if (existing) {
      // Update existing record
      existing.status = status;
      existing.markedBy = req.user.id;
      existing.markedAt = new Date();
    } else {
      // Add new attendance record
      staff.attendance.push({ date, status, markedBy: req.user.id });
    }

    await staff.save();
    res.json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update staff details
// @route   PUT /api/staff/:id
// @access  Private/Resident/Admin
const updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }

    res.json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete staff member
// @route   DELETE /api/staff/:id
// @access  Private/Admin
const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }

    res.json({ success: true, message: 'Staff member removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { addStaff, getStaff, getStaffById, markAttendance, updateStaff, deleteStaff };
