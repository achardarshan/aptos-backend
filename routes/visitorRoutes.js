// routes/visitorRoutes.js — Visitor management endpoints
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  addVisitor,
  getVisitors,
  updateVisitorStatus,
  markExit,
  deleteVisitor,
  getVisitorStats,
} = require('../controllers/visitorController');

// Stats route (admin only)
router.get('/stats', protect, authorize('admin'), getVisitorStats);

// Main CRUD routes
router.post('/', protect, authorize('security', 'admin'), addVisitor);
router.get('/', protect, getVisitors);
router.put('/:id/status', protect, authorize('resident', 'admin'), updateVisitorStatus);
router.put('/:id/exit', protect, authorize('security', 'admin'), markExit);
router.delete('/:id', protect, authorize('admin'), deleteVisitor);

module.exports = router;
