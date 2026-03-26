// routes/complaintRoutes.js — Complaint management endpoints
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createComplaint,
  getComplaints,
  updateComplaint,
  deleteComplaint,
} = require('../controllers/complaintController');

router.post('/', protect, authorize('resident', 'admin'), createComplaint);
router.get('/', protect, getComplaints);
router.put('/:id', protect, authorize('admin'), updateComplaint);
router.delete('/:id', protect, authorize('admin'), deleteComplaint);

module.exports = router;
