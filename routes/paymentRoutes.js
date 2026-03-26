// routes/paymentRoutes.js — Payment management endpoints
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createPayment,
  createBulkPayments,
  getPayments,
  markAsPaid,
  markAsUnpaid,
  deletePayment,
} = require('../controllers/paymentController');

router.post('/', protect, authorize('admin'), createPayment);
router.post('/bulk', protect, authorize('admin'), createBulkPayments);
router.get('/', protect, getPayments);
router.put('/:id/pay', protect, authorize('admin'), markAsPaid);
router.put('/:id/unpay', protect, authorize('admin'), markAsUnpaid);
router.delete('/:id', protect, authorize('admin'), deletePayment);

module.exports = router;
