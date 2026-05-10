const PaymentService = require('../services/PaymentService');
const OrderService = require('../services/OrderService');
const logger = require('../utils/logger');

/**
 * POST /api/payments/vnpay/checkout - Initiate VNPay payment
 */
async function initiateVNPayPayment(req, res, next) {
  try {
    const { userId } = req;
    const { orderId } = req.body;

    // Get order
    const order = await OrderService.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    // Check if order belongs to user
    if (order.user_id !== userId) {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    const existingPayment = await PaymentService.getPaymentByOrder(orderId);

    if (existingPayment?.status === 'completed') {
      return res.status(400).json({ error: 'Đơn hàng đã được thanh toán' });
    }

    if (!existingPayment) {
      await PaymentService.createPayment(
        orderId,
        order.total_amount,
        order.payment_method,
        order.payment_method || 'vnpay'
      );
    }

    // Build VNPay URL
    let redirectUrl;
    if (process.env.DEMO_MODE === 'true') {
      // Mock successful payment redirect for demo
      const returnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:5173/checkout/return';
      redirectUrl = `${returnUrl}?vnp_ResponseCode=00&vnp_TxnRef=${orderId}&vnp_TransactionStatus=00&vnp_Amount=${order.total_amount * 100}`;
      logger.info(`DEMO MODE: Mocking payment redirect for order ${orderId}`);
    } else {
      redirectUrl = PaymentService.buildVNPayUrl(
        orderId,
        order.total_amount,
        `Order ${order.order_number}`
      );
    }

    res.json({ redirectUrl });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/payments/vnpay/ipn - VNPay webhook (IPN)
 * NO AUTHENTICATION - Signature validated only
 */
async function handleVNPayIPN(req, res, next) {
  try {
    const result = await PaymentService.handleVNPayIPN(req.query);

    // Always return 200 to VNPay
    res.json(result);
  } catch (error) {
    logger.error('handleVNPayIPN error:', error);
    res.json({ RspCode: '99', Message: 'Unknown error' });
  }
}

/**
 * GET /api/payments/status/:orderId - Check payment status
 */
async function getPaymentStatus(req, res, next) {
  try {
    const { userId } = req;
    const { orderId } = req.params;

    // Get order
    const order = await OrderService.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    // Check if order belongs to user
    if (order.user_id !== userId) {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    // Get payment
    const payment = await PaymentService.getPaymentByOrder(orderId);

    res.json({
      orderId,
      status: order.status,
      paymentStatus: order.payment_status,
      payment: payment || null,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  initiateVNPayPayment,
  handleVNPayIPN,
  getPaymentStatus,
};
