const express = require('express');
const request = require('supertest');

jest.mock('../src/middlewares/auth.middleware', () => ({
  adminMiddleware: (req, res, next) => {
    req.userId = 'admin-1';
    req.user = { id: 'admin-1', email: 'admin@banhkem.com' };
    next();
  },
}));

jest.mock('../src/services/OrderService', () => ({
  getOrdersForAdmin: jest.fn(),
  getOrderById: jest.fn(),
  updateOrderStatus: jest.fn(),
}));

jest.mock('../src/services/ProductService', () => ({
  getCategories: jest.fn(),
  getProductsForAdmin: jest.fn(),
  getProductById: jest.fn(),
  createProduct: jest.fn(),
  updateProduct: jest.fn(),
  createVariant: jest.fn(),
  updateVariant: jest.fn(),
  deleteVariant: jest.fn(),
}));

jest.mock('../src/services/CouponService', () => ({
  getCouponsForAdmin: jest.fn(),
  createCoupon: jest.fn(),
  updateCoupon: jest.fn(),
}));

const OrderService = require('../src/services/OrderService');
const ProductService = require('../src/services/ProductService');
const CouponService = require('../src/services/CouponService');
const adminRoutes = require('../src/routes/admin.routes');
const { errorHandlerMiddleware } = require('../src/middlewares/errorHandler.middleware');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminRoutes);
  app.use(errorHandlerMiddleware);
  return app;
}

describe('admin routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/admin/orders validates limit', async () => {
    const app = buildApp();

    const response = await request(app)
      .get('/api/admin/orders')
      .query({ limit: 'abc' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('limit phải là số nguyên dương');
    expect(OrderService.getOrdersForAdmin).not.toHaveBeenCalled();
  });

  test('GET /api/admin/orders returns admin order list', async () => {
    const app = buildApp();

    OrderService.getOrdersForAdmin.mockResolvedValue([{ id: 'order-1' }]);

    const response = await request(app)
      .get('/api/admin/orders')
      .query({ status: 'pending', limit: '20', offset: '0' });

    expect(response.status).toBe(200);
    expect(OrderService.getOrdersForAdmin).toHaveBeenCalledWith({
      status: 'pending',
      startDate: undefined,
      endDate: undefined,
      limit: 20,
      offset: 0,
    });
    expect(response.body.count).toBe(1);
  });

  test('GET /api/admin/orders/:orderId returns order detail', async () => {
    const app = buildApp();

    OrderService.getOrderById.mockResolvedValue({ id: 'order-1', items: [{ id: 'item-1' }] });

    const response = await request(app).get('/api/admin/orders/order-1');

    expect(response.status).toBe(200);
    expect(OrderService.getOrderById).toHaveBeenCalledWith('order-1');
    expect(response.body.items).toHaveLength(1);
  });

  test('POST /api/admin/products validates required fields', async () => {
    const app = buildApp();

    const response = await request(app)
      .post('/api/admin/products')
      .send({ sku: 'CAKE-01' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Cần sku, tên, categoryId và giá cơ bản');
    expect(ProductService.createProduct).not.toHaveBeenCalled();
  });

  test('PATCH /api/admin/products/:productId updates product with normalized fields', async () => {
    const app = buildApp();

    ProductService.updateProduct.mockResolvedValue({ id: 'product-1', base_price: 450000 });

    const response = await request(app)
      .patch('/api/admin/products/product-1')
      .send({ basePrice: '450000', minAdvanceHours: '72', status: 'active' });

    expect(response.status).toBe(200);
    expect(ProductService.updateProduct).toHaveBeenCalledWith('product-1', {
      base_price: 450000,
      min_advance_hours: 72,
      status: 'active',
    });
  });

  test('POST /api/admin/products/:productId/variants creates product variant', async () => {
    const app = buildApp();

    ProductService.getProductById.mockResolvedValue({ id: 'product-1' });
    ProductService.createVariant.mockResolvedValue({ id: 'variant-1', variant_sku: 'SKU-01' });

    const response = await request(app)
      .post('/api/admin/products/product-1/variants')
      .send({
        variantSku: 'SKU-01',
        stockQuantity: '8',
        priceAdjustment: '90000',
      });

    expect(response.status).toBe(201);
    expect(ProductService.createVariant).toHaveBeenCalledWith('product-1', expect.objectContaining({
      variantSku: 'SKU-01',
      stockQuantity: 8,
      priceAdjustment: 90000,
    }));
  });

  test('PATCH /api/admin/variants/:variantId updates variant fields', async () => {
    const app = buildApp();

    ProductService.updateVariant.mockResolvedValue({ id: 'variant-1', stock_quantity: 5 });

    const response = await request(app)
      .patch('/api/admin/variants/variant-1')
      .send({ stockQuantity: '5', priceAdjustment: '45000' });

    expect(response.status).toBe(200);
    expect(ProductService.updateVariant).toHaveBeenCalledWith('variant-1', {
      stock_quantity: 5,
      price_adjustment: 45000,
    });
  });

  test('DELETE /api/admin/variants/:variantId deletes variant', async () => {
    const app = buildApp();

    ProductService.deleteVariant.mockResolvedValue({ id: 'variant-1' });

    const response = await request(app).delete('/api/admin/variants/variant-1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ deleted: true, variantId: 'variant-1' });
  });

  test('POST /api/admin/coupons creates coupon with normalized numeric fields', async () => {
    const app = buildApp();

    CouponService.createCoupon.mockResolvedValue({ id: 'coupon-1', code: 'WELCOME10' });

    const response = await request(app)
      .post('/api/admin/coupons')
      .send({
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: '10',
        maxUses: '100',
        minOrderAmount: '250000',
        validFrom: '2026-01-01T00:00:00Z',
        validUntil: '2026-12-31T23:59:59Z',
      });

    expect(response.status).toBe(201);
    expect(CouponService.createCoupon).toHaveBeenCalledWith({
      code: 'WELCOME10',
      discountType: 'percentage',
      discountValue: 10,
      maxUses: 100,
      minOrderAmount: 250000,
      validFrom: '2026-01-01T00:00:00Z',
      validUntil: '2026-12-31T23:59:59Z',
    });
    expect(response.body.code).toBe('WELCOME10');
  });

  test('PATCH /api/admin/coupons/:couponId updates coupon fields', async () => {
    const app = buildApp();

    CouponService.updateCoupon.mockResolvedValue({ id: 'coupon-1', status: 'inactive' });

    const response = await request(app)
      .patch('/api/admin/coupons/coupon-1')
      .send({ status: 'inactive', minOrderAmount: '300000' });

    expect(response.status).toBe(200);
    expect(CouponService.updateCoupon).toHaveBeenCalledWith('coupon-1', {
      min_order_amount: 300000,
      status: 'inactive',
    });
  });
});
