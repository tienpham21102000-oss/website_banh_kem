const express = require('express');
const request = require('supertest');

jest.mock('../src/services/DeliveryWindowService', () => ({
  getAvailableSlots: jest.fn(),
  validateDeliveryWindow: jest.fn(),
}));

const DeliveryWindowService = require('../src/services/DeliveryWindowService');
const deliveryRoutes = require('../src/routes/delivery.routes');
const { errorHandlerMiddleware } = require('../src/middlewares/errorHandler.middleware');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/delivery', deliveryRoutes);
  app.use(errorHandlerMiddleware);
  return app;
}

describe('delivery routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/delivery/available-slots requires productId', async () => {
    const app = buildApp();

    const response = await request(app).get('/api/delivery/available-slots');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Cần productId');
    expect(DeliveryWindowService.getAvailableSlots).not.toHaveBeenCalled();
  });

  test('GET /api/delivery/available-slots returns service payload', async () => {
    const app = buildApp();

    DeliveryWindowService.getAvailableSlots.mockResolvedValue({
      availableDates: ['2026-05-10'],
      availableTimeSlots: ['morning', 'afternoon', 'evening'],
      availableSlotsByDate: {
        '2026-05-10': ['afternoon', 'evening'],
      },
      minAdvanceHours: 48,
    });

    const response = await request(app)
      .get('/api/delivery/available-slots')
      .query({ productId: 'product-1' });

    expect(response.status).toBe(200);
    expect(DeliveryWindowService.getAvailableSlots).toHaveBeenCalledWith('product-1');
    expect(response.body.availableSlotsByDate['2026-05-10']).toEqual(['afternoon', 'evening']);
  });

  test('POST /api/delivery/validate forwards valid payload to the service', async () => {
    const app = buildApp();

    DeliveryWindowService.validateDeliveryWindow.mockResolvedValue({
      valid: true,
      requestedDate: '2026-05-10',
      requestedTime: 'evening',
    });

    const response = await request(app)
      .post('/api/delivery/validate')
      .send({
        productId: 'product-1',
        date: '2026-05-10',
        time: 'evening',
      });

    expect(response.status).toBe(200);
    expect(DeliveryWindowService.validateDeliveryWindow).toHaveBeenCalledWith(
      'product-1',
      '2026-05-10',
      'evening'
    );
    expect(response.body.valid).toBe(true);
  });
});
