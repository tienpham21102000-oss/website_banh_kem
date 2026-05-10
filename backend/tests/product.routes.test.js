const express = require('express');
const request = require('supertest');

jest.mock('../src/services/ProductService', () => ({
  getProducts: jest.fn(),
  getProductById: jest.fn(),
}));

const ProductService = require('../src/services/ProductService');
const productRoutes = require('../src/routes/products.routes');
const { errorHandlerMiddleware } = require('../src/middlewares/errorHandler.middleware');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/products', productRoutes);
  app.use(errorHandlerMiddleware);
  return app;
}

describe('product routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/products rejects invalid limit', async () => {
    const app = buildApp();

    const response = await request(app)
      .get('/api/products')
      .query({ limit: 'abc' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('limit phải là số nguyên dương');
    expect(ProductService.getProducts).not.toHaveBeenCalled();
  });

  test('GET /api/products forwards parsed filters', async () => {
    const app = buildApp();

    ProductService.getProducts.mockResolvedValue([
      { id: 'product-1', name: 'Cake 1' },
    ]);

    const response = await request(app)
      .get('/api/products')
      .query({ search: 'cake', sortBy: 'name', limit: '12', offset: '3' });

    expect(response.status).toBe(200);
    expect(ProductService.getProducts).toHaveBeenCalledWith({
      category: undefined,
      search: 'cake',
      sortBy: 'name',
      limit: 12,
      offset: 3,
    });
    expect(response.body.count).toBe(1);
  });

  test('GET /api/products/:id returns 404 when product does not exist', async () => {
    const app = buildApp();

    ProductService.getProductById.mockResolvedValue(null);

    const response = await request(app).get('/api/products/missing-id');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Không tìm thấy sản phẩm');
  });
});
