const express = require('express');
const PaymentController = require('../controllers/PaymentController');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/vnpay/ipn', PaymentController.handleVNPayIPN);
router.get('/vnpay/ipn', PaymentController.handleVNPayIPN);
router.post('/vnpay/checkout', authMiddleware, PaymentController.initiateVNPayPayment);
router.get('/status/:orderId', authMiddleware, PaymentController.getPaymentStatus);

module.exports = router;
