const express = require('express');
const request = require('supertest');

jest.mock('../src/middlewares/auth.middleware', () => ({
  authMiddleware: (req, res, next) => {
    req.userId = 'user-1';
    next();
  },
}));

jest.mock('../src/services/CartService', () => ({
  getCart: jest.fn(),
  addToCart: jest.fn(),
  removeFromCart: jest.fn(),
  updateItemQuantity: jest.fn(),
  clearCart: jest.fn(),
}));

jest.mock('../src/services/ProductService', () => ({
  getVariant: jest.fn(),
  checkStock: jest.fn(),
}));

const CartService = require('../src/services/CartService');
const ProductService = require('../src/services/ProductService');
const cartRoutes = require('../src/routes/cart.routes');
const { errorHandlerMiddleware } = require('../src/middlewares/errorHandler.middleware');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/cart', cartRoutes);
  app.use(errorHandlerMiddleware);
  return app;
}

describe('cart routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/cart rejects invalid quantity', async () => {
    const app = buildApp();

    const response = await request(app)
      .post('/api/cart')
      .send({ variantId: 'variant-1', quantity: 0 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Số lượng phải là số nguyên dương');
    expect(ProductService.getVariant).not.toHaveBeenCalled();
  });

  test('POST /api/cart adds an item when variant exists and stock is available', async () => {
    const app = buildApp();

    ProductService.getVariant.mockResolvedValue({ id: 'variant-1' });
    ProductService.checkStock.mockResolvedValue({ available: true, stock: 10 });
    CartService.addToCart.mockResolvedValue({
      items: [{ variantId: 'variant-1', quantity: 2 }],
      subtotal: 640000,
      total: 640000,
    });

    const response = await request(app)
      .post('/api/cart')
      .send({ variantId: 'variant-1', quantity: 2, customNotes: 'Less sugar' });

    expect(response.status).toBe(201);
    expect(ProductService.getVariant).toHaveBeenCalledWith('variant-1');
    expect(ProductService.checkStock).toHaveBeenCalledWith('variant-1', 2);
    expect(CartService.addToCart).toHaveBeenCalledWith('user-1', 'variant-1', 2, 'Less sugar');
    expect(response.body.total).toBe(640000);
  });

  test('PUT /api/cart/:variantId validates integer quantity', async () => {
    const app = buildApp();

    const response = await request(app)
      .put('/api/cart/variant-1')
      .send({ quantity: 1.5 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Số lượng phải là số nguyên');
    expect(CartService.updateItemQuantity).not.toHaveBeenCalled();
  });
});
