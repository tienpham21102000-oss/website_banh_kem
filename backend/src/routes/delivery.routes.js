const express = require('express');
const DeliveryController = require('../controllers/DeliveryController');

const router = express.Router();

router.get('/available-slots', DeliveryController.getAvailableSlots);
router.post('/validate', DeliveryController.validateDeliveryWindow);

module.exports = router;
