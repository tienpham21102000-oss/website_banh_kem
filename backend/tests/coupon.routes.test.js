const express = require('express');
const request = require('supertest');

jest.mock('../src/services/CouponService', () => ({
  validateCoupon: jest.fn(),
  applyCoupon: jest.fn(),
  getActiveCoupons: jest.fn(),
}));

const CouponService = require('../src/services/CouponService');
const couponRoutes = require('../src/routes/coupons.routes');
const { errorHandlerMiddleware } = require('../src/middlewares/errorHandler.middleware');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/coupons', couponRoutes);
  app.use(errorHandlerMiddleware);
  return app;
}

describe('coupon routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/coupons/validate requires code', async () => {
    const app = buildApp();

    const response = await request(app)
      .post('/api/coupons/validate')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Cần mã giảm giá');
    expect(CouponService.validateCoupon).not.toHaveBeenCalled();
  });

  test('POST /api/coupons/apply rejects invalid cartTotal', async () => {
    const app = buildApp();

    const response = await request(app)
      .post('/api/coupons/apply')
      .send({ code: 'WELCOME10', cartTotal: 'abc' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('cartTotal phải là số không âm');
    expect(CouponService.applyCoupon).not.toHaveBeenCalled();
  });

  test('POST /api/coupons/apply forwards normalized numeric cartTotal', async () => {
    const app = buildApp();

    CouponService.applyCoupon.mockResolvedValue({
      valid: true,
      discountAmount: 50000,
      finalTotal: 450000,
    });

    const response = await request(app)
      .post('/api/coupons/apply')
      .send({ code: 'WELCOME10', cartTotal: '500000' });

    expect(response.status).toBe(200);
    expect(CouponService.applyCoupon).toHaveBeenCalledWith('WELCOME10', 500000);
    expect(response.body.finalTotal).toBe(450000);
  });
});
