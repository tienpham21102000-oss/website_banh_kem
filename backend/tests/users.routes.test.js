const express = require('express');
const request = require('supertest');

jest.mock('../src/middlewares/auth.middleware', () => ({
  authMiddleware: (req, res, next) => {
    req.userId = 'user-1';
    next();
  },
}));

jest.mock('../src/services/AuthService', () => ({
  getUserById: jest.fn(),
}));

const AuthService = require('../src/services/AuthService');
const usersRoutes = require('../src/routes/users.routes');
const { errorHandlerMiddleware } = require('../src/middlewares/errorHandler.middleware');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/users', usersRoutes);
  app.use(errorHandlerMiddleware);
  return app;
}

describe('users routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/users/me returns current user profile', async () => {
    const app = buildApp();

    AuthService.getUserById.mockResolvedValue({
      id: 'user-1',
      email: 'demo@example.com',
    });

    const response = await request(app).get('/api/users/me');

    expect(response.status).toBe(200);
    expect(AuthService.getUserById).toHaveBeenCalledWith('user-1');
    expect(response.body.email).toBe('demo@example.com');
  });
});
