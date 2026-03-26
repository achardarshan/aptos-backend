// routes/staffRoutes.js — Staff management endpoints
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  addStaff,
  getStaff,
  getStaffById,
  markAttendance,
  updateStaff,
  deleteStaff,
} = require('../controllers/staffController');

router.post('/', protect, authorize('resident', 'admin'), addStaff);
router.get('/', protect, getStaff);
router.get('/:id', protect, getStaffById);
router.post('/:id/attendance', protect, authorize('resident', 'admin'), markAttendance);
router.put('/:id', protect, authorize('resident', 'admin'), updateStaff);
router.delete('/:id', protect, authorize('admin'), deleteStaff);

module.exports = router;
