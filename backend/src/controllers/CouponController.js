const CouponService = require('../services/CouponService');
const logger = require('../utils/logger');

/**
 * POST /api/coupons/validate - Validate coupon
 */
async function validateCoupon(req, res, next) {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Cần mã giảm giá' });
    }

    const result = await CouponService.validateCoupon(code);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/coupons/apply - Apply coupon to total
 */
async function applyCoupon(req, res, next) {
  try {
    const { code, cartTotal } = req.body;

    if (!code || cartTotal === undefined) {
      return res.status(400).json({ error: 'Cần code và cartTotal' });
    }

    const parsedTotal = Number(cartTotal);
    if (isNaN(parsedTotal) || parsedTotal < 0) {
      return res.status(400).json({ error: 'cartTotal phải là số không âm' });
    }

    const result = await CouponService.applyCoupon(code, parsedTotal);

    res.json(result);
  } catch (error) {
    logger.warn(`Coupon apply error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
}

/**
 * GET /api/coupons - Get active coupons
 */
async function getActiveCoupons(req, res, next) {
  try {
    const coupons = await CouponService.getActiveCoupons();

    res.json({ coupons, count: coupons.length });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  validateCoupon,
  applyCoupon,
  getActiveCoupons,
};
