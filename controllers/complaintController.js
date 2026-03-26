// controllers/complaintController.js — Complaint CRUD and status management
const Complaint = require('../models/Complaint');
const User = require('../models/User');

// Helper: Add notification to a user
const addNotification = async (userId, message) => {
  await User.findByIdAndUpdate(userId, {
    $push: { notifications: { message, read: false } },
  });
};

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Private/Resident
const createComplaint = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;

    const complaint = await Complaint.create({
      title,
      description,
      category,
      priority,
      raisedBy: req.user.id,
      flatNumber: req.user.flatNumber,
    });

    // Notify all admins about new complaint
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await addNotification(
        admin._id,
        `New complaint from Flat ${req.user.flatNumber}: "${title}" (${priority} priority)`
      );
    }

    res.status(201).json({ success: true, complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all complaints (admin) or own complaints (resident)
// @route   GET /api/complaints
// @access  Private
const getComplaints = async (req, res) => {
  try {
    let query = {};

    // Residents only see their own complaints
    if (req.user.role === 'resident') {
      query.raisedBy = req.user.id;
    }

    const complaints = await Complaint.find(query)
      .populate('raisedBy', 'name flatNumber')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: complaints.length, complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update complaint status (admin only)
// @route   PUT /api/complaints/:id
// @access  Private/Admin
const updateComplaint = async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.status = status || complaint.status;
    complaint.adminNote = adminNote || complaint.adminNote;

    if (status === 'resolved') {
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    // Notify the resident who raised the complaint
    await addNotification(
      complaint.raisedBy,
      `Your complaint "${complaint.title}" has been updated to: ${complaint.status}. ${adminNote ? 'Note: ' + adminNote : ''}`
    );

    res.json({ success: true, complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete complaint
// @route   DELETE /api/complaints/:id
// @access  Private/Admin
const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    res.json({ success: true, message: 'Complaint deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createComplaint, getComplaints, updateComplaint, deleteComplaint };
