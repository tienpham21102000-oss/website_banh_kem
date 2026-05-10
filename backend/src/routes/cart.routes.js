const express = require('express');
const CartController = require('../controllers/CartController');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', CartController.getCart);
router.post('/', CartController.addToCart);
router.delete('/', CartController.clearCart);
router.put('/:variantId', CartController.updateItemQuantity);
router.delete('/:variantId', CartController.removeFromCart);

module.exports = router;
