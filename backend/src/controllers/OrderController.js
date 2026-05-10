const OrderService = require('../services/OrderService');
const CartService = require('../services/CartService');
const CouponService = require('../services/CouponService');
const NotificationService = require('../services/NotificationService');
const AuthService = require('../services/AuthService');

/**
 * POST /api/orders - Create order
 */
async function createOrder(req, res, next) {
  try {
    const { userId } = req;
    const {
      shippingAddress,
      shippingMethod,
      deliveryDate,
      deliveryTime,
      customNotes = '',
      couponCode = '',
      paymentMethod = 'vnpay',
    } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({ error: 'Cần có địa chỉ giao hàng' });
    }

    // Get cart
    const cart = await CartService.getCart(userId);

    if (cart.items.length === 0) {
      return res.status(400).json({ error: 'Giỏ hàng trống' });
    }

    // Prepare cart items with product info
    const cartItems = cart.items.map(item => ({
      variantId: item.variantId,
      quantity: item.quantity,
      customNotes: item.customNotes || '',
    }));

    // Calculate discount if coupon applied
    let discountAmount = 0;
    if (couponCode) {
      try {
        const couponResult = await CouponService.applyCoupon(couponCode, cart.subtotal);
        discountAmount = couponResult.discountAmount;
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
    }

    // Create order
    const order = await OrderService.createOrder(userId, {
      cartItems,
      shippingAddress,
      shippingMethod,
      deliveryDate,
      deliveryTime,
      customNotes,
      couponCode,
      paymentMethod,
      discountAmount,
    });

    // Get user for email
    const user = await AuthService.getUserById(userId);

    // Send confirmation email
    await NotificationService.sendOrderConfirmationEmail(order, user);

    // Clear cart
    await CartService.clearCart(userId);

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/orders - Get user orders
 */
async function getOrders(req, res, next) {
  try {
    const { userId } = req;
    const { limit = 50, offset = 0 } = req.query;

    const orders = await OrderService.getUserOrders(
      userId,
      parseInt(limit),
      parseInt(offset)
    );

    res.json({ orders, count: orders.length });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/orders/:orderId - Get order details
 */
async function getOrderById(req, res, next) {
  try {
    const { userId } = req;
    const { orderId } = req.params;

    const order = await OrderService.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    // Check if order belongs to user
    if (order.user_id !== userId) {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
};
