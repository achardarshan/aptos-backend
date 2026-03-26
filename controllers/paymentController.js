// controllers/paymentController.js — Maintenance payment management
const Payment = require('../models/Payment');
const User = require('../models/User');

// Helper: Add notification to a user
const addNotification = async (userId, message) => {
  await User.findByIdAndUpdate(userId, {
    $push: { notifications: { message, read: false } },
  });
};

// @desc    Create payment due (admin only)
// @route   POST /api/payments
// @access  Private/Admin
const createPayment = async (req, res) => {
  try {
    const { title, amount, dueDate, flatNumber, month } = req.body;

    // Find the resident for this flat
    const resident = await User.findOne({ flatNumber, role: 'resident' });
    if (!resident) {
      return res.status(404).json({ success: false, message: `No resident found for flat ${flatNumber}` });
    }

    const payment = await Payment.create({
      title,
      amount,
      dueDate,
      flatNumber,
      month,
      resident: resident._id,
      createdBy: req.user.id,
    });

    // Notify the resident about the new due
    await addNotification(
      resident._id,
      `New maintenance due: "${title}" of ₹${amount} for ${month}. Due date: ${new Date(dueDate).toLocaleDateString()}`
    );

    res.status(201).json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create payments for all residents at once (admin bulk)
// @route   POST /api/payments/bulk
// @access  Private/Admin
const createBulkPayments = async (req, res) => {
  try {
    const { title, amount, dueDate, month } = req.body;

    // Get all residents
    const residents = await User.find({ role: 'resident' });

    if (residents.length === 0) {
      return res.status(400).json({ success: false, message: 'No residents found' });
    }

    const payments = [];
    for (const resident of residents) {
      const payment = await Payment.create({
        title,
        amount,
        dueDate,
        flatNumber: resident.flatNumber,
        month,
        resident: resident._id,
        createdBy: req.user.id,
      });
      payments.push(payment);

      // Notify each resident
      await addNotification(
        resident._id,
        `New maintenance due: "${title}" of ₹${amount} for ${month}. Due: ${new Date(dueDate).toLocaleDateString()}`
      );
    }

    res.status(201).json({ success: true, count: payments.length, message: `Created ${payments.length} payment records` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all payments (admin) or own payments (resident)
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res) => {
  try {
    let query = {};

    // Residents only see their own payments
    if (req.user.role === 'resident') {
      query.resident = req.user.id;
    }

    const payments = await Payment.find(query)
      .populate('resident', 'name flatNumber')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: payments.length, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark payment as paid
// @route   PUT /api/payments/:id/pay
// @access  Private/Admin
const markAsPaid = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    payment.status = 'paid';
    payment.paidAt = new Date();
    await payment.save();

    // Notify the resident that payment is confirmed
    await addNotification(
      payment.resident,
      `Payment confirmed: "${payment.title}" of ₹${payment.amount} for ${payment.month} marked as paid.`
    );

    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark payment as unpaid (admin)
// @route   PUT /api/payments/:id/unpay
// @access  Private/Admin
const markAsUnpaid = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status: 'unpaid', paidAt: null },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete payment record (admin)
// @route   DELETE /api/payments/:id
// @access  Private/Admin
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({ success: true, message: 'Payment record deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createPayment, createBulkPayments, getPayments, markAsPaid, markAsUnpaid, deletePayment };
