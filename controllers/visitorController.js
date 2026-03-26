// controllers/visitorController.js — Visitor management CRUD
const Visitor = require('../models/Visitor');
const User = require('../models/User');

// Helper: Add notification to a user
const addNotification = async (userId, message) => {
  await User.findByIdAndUpdate(userId, {
    $push: { notifications: { message, read: false } },
  });
};

// @desc    Add a new visitor (security logs visitor at gate)
// @route   POST /api/visitors
// @access  Private/Security
const addVisitor = async (req, res) => {
  try {
    const { name, phone, purpose, flatNumber } = req.body;

    const visitor = await Visitor.create({
      name,
      phone,
      purpose,
      flatNumber,
      addedBy: req.user.id,
      entryTime: new Date(),
    });

    // Notify the resident of that flat about the visitor
    const resident = await User.findOne({ flatNumber, role: 'resident' });
    if (resident) {
      await addNotification(
        resident._id,
        `New visitor "${name}" is waiting at the gate for Flat ${flatNumber}. Purpose: ${purpose}`
      );
    }

    res.status(201).json({ success: true, visitor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all visitors (admin) or visitors for a flat (resident) or all (security)
// @route   GET /api/visitors
// @access  Private
const getVisitors = async (req, res) => {
  try {
    let query = {};

    // Residents only see visitors for their flat
    if (req.user.role === 'resident') {
      query.flatNumber = req.user.flatNumber;
    }

    const visitors = await Visitor.find(query)
      .populate('addedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: visitors.length, visitors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update visitor status (resident approves/rejects)
// @route   PUT /api/visitors/:id/status
// @access  Private/Resident
const updateVisitorStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor not found' });
    }

    // Residents can only update visitors for their flat
    if (req.user.role === 'resident' && visitor.flatNumber !== req.user.flatNumber) {
      return res.status(403).json({ success: false, message: 'Not authorized for this visitor' });
    }

    visitor.status = status;
    visitor.approvedBy = req.user.id;

    // If approved, record entry time; if rejected, clear entry time
    if (status === 'approved') {
      visitor.entryTime = visitor.entryTime || new Date();
    }

    await visitor.save();

    // Notify the security guard about the decision
    const securityGuard = await User.findById(visitor.addedBy);
    if (securityGuard) {
      await addNotification(
        securityGuard._id,
        `Visitor "${visitor.name}" for Flat ${visitor.flatNumber} has been ${status} by resident.`
      );
    }

    res.json({ success: true, visitor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark visitor exit time
// @route   PUT /api/visitors/:id/exit
// @access  Private/Security
const markExit = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor not found' });
    }

    visitor.exitTime = new Date();
    await visitor.save();

    res.json({ success: true, visitor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a visitor record (admin only)
// @route   DELETE /api/visitors/:id
// @access  Private/Admin
const deleteVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findByIdAndDelete(req.params.id);

    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor not found' });
    }

    res.json({ success: true, message: 'Visitor record deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get visitor stats for dashboard
// @route   GET /api/visitors/stats
// @access  Private/Admin
const getVisitorStats = async (req, res) => {
  try {
    const total = await Visitor.countDocuments();
    const pending = await Visitor.countDocuments({ status: 'pending' });
    const approved = await Visitor.countDocuments({ status: 'approved' });
    const rejected = await Visitor.countDocuments({ status: 'rejected' });

    res.json({ success: true, stats: { total, pending, approved, rejected } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { addVisitor, getVisitors, updateVisitorStatus, markExit, deleteVisitor, getVisitorStats };
