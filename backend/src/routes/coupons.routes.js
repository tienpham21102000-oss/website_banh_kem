const express = require('express');
const CouponController = require('../controllers/CouponController');

const router = express.Router();

router.get('/', CouponController.getActiveCoupons);
router.post('/validate', CouponController.validateCoupon);
router.post('/apply', CouponController.applyCoupon);

module.exports = router;
