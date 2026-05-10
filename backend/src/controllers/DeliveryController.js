const DeliveryWindowService = require('../services/DeliveryWindowService');
const logger = require('../utils/logger');

/**
 * GET /api/delivery/available-slots - Get available delivery slots
 */
async function getAvailableSlots(req, res, next) {
  try {
    const { productId } = req.query;

    if (!productId) {
      return res.status(400).json({ error: 'Cần productId' });
    }

    const slots = await DeliveryWindowService.getAvailableSlots(productId);

    res.json(slots);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/delivery/validate - Validate delivery window
 */
async function validateDeliveryWindow(req, res, next) {
  try {
    const { productId, date, time } = req.body;

    if (!productId || !date || !time) {
      return res.status(400).json({ error: 'Cần productId, ngày và khung giờ' });
    }

    const result = await DeliveryWindowService.validateDeliveryWindow(productId, date, time);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAvailableSlots,
  validateDeliveryWindow,
};
