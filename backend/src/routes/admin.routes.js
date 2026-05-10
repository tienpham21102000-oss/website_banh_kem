const express = require('express');
const AdminController = require('../controllers/AdminController');
const { adminMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(adminMiddleware);
router.get('/orders', AdminController.getOrders);
router.get('/orders/:orderId', AdminController.getOrderById);
router.patch('/orders/:orderId/status', AdminController.updateOrderStatus);
router.get('/categories', AdminController.getCategories);
router.get('/products', AdminController.getProducts);
router.post('/products', AdminController.createProduct);
router.patch('/products/:productId', AdminController.updateProduct);
router.post('/products/:productId/variants', AdminController.createVariant);
router.patch('/variants/:variantId', AdminController.updateVariant);
router.delete('/variants/:variantId', AdminController.deleteVariant);
router.get('/coupons', AdminController.getCoupons);
router.post('/coupons', AdminController.createCoupon);
router.patch('/coupons/:couponId', AdminController.updateCoupon);
router.delete('/coupons/:couponId', AdminController.deleteCoupon);
router.get('/stats', AdminController.getStats);

module.exports = router;
