const express = require('express');
const request = require('supertest');

jest.mock('../src/middlewares/auth.middleware', () => ({
  authMiddleware: (req, res, next) => {
    req.userId = 'user-1';
    next();
  },
}));

jest.mock('../src/services/OrderService', () => ({
  createOrder: jest.fn(),
  getUserOrders: jest.fn(),
  getOrderById: jest.fn(),
}));

jest.mock('../src/services/CartService', () => ({
  getCart: jest.fn(),
  clearCart: jest.fn(),
}));

jest.mock('../src/services/CouponService', () => ({
  applyCoupon: jest.fn(),
}));

jest.mock('../src/services/NotificationService', () => ({
  sendOrderConfirmationEmail: jest.fn(),
}));

jest.mock('../src/services/AuthService', () => ({
  getUserById: jest.fn(),
}));

const OrderService = require('../src/services/OrderService');
const CartService = require('../src/services/CartService');
const CouponService = require('../src/services/CouponService');
const NotificationService = require('../src/services/NotificationService');
const AuthService = require('../src/services/AuthService');
const orderRoutes = require('../src/routes/orders.routes');
const { errorHandlerMiddleware } = require('../src/middlewares/errorHandler.middleware');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/orders', orderRoutes);
  app.use(errorHandlerMiddleware);
  return app;
}

describe('order routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/orders validates shippingAddress before accessing cart services', async () => {
    const app = buildApp();

    const response = await request(app)
      .post('/api/orders')
      .send({
        shippingMethod: 'standard',
        deliveryDate: '2026-05-10',
        deliveryTime: 'morning',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Cần có địa chỉ giao hàng');
    expect(CartService.getCart).not.toHaveBeenCalled();
  });

  test('POST /api/orders creates order and clears cart on success', async () => {
    const app = buildApp();

    CartService.getCart.mockResolvedValue({
      items: [
        { variantId: 'variant-1', quantity: 2, customNotes: '', subtotal: 640000 },
      ],
      subtotal: 640000,
    });
    OrderService.createOrder.mockResolvedValue({
      id: 'order-1',
      order_number: 'ORD-20260503-00001',
    });
    AuthService.getUserById.mockResolvedValue({ id: 'user-1', email: 'demo@example.com' });
    NotificationService.sendOrderConfirmationEmail.mockResolvedValue({ sent: false });
    CartService.clearCart.mockResolvedValue({});

    const response = await request(app)
      .post('/api/orders')
      .send({
        shippingAddress: {
          recipientName: 'Demo User',
          phone: '0900000000',
          addressLine: '123 Cake Street',
        },
        shippingMethod: 'standard',
        deliveryDate: '2026-05-10',
        deliveryTime: 'morning',
        customNotes: 'Please write happy birthday',
        paymentMethod: 'vnpay',
      });

    expect(response.status).toBe(201);
    expect(OrderService.createOrder).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        shippingMethod: 'standard',
        deliveryDate: '2026-05-10',
        deliveryTime: 'morning',
        discountAmount: 0,
        cartItems: [
          { variantId: 'variant-1', quantity: 2, customNotes: '' },
        ],
      })
    );
    expect(NotificationService.sendOrderConfirmationEmail).toHaveBeenCalled();
    expect(CartService.clearCart).toHaveBeenCalledWith('user-1');
    expect(response.body).toEqual({
      id: 'order-1',
      order_number: 'ORD-20260503-00001',
    });
    expect(CouponService.applyCoupon).not.toHaveBeenCalled();
  });
});
