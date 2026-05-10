const express = require('express');
const request = require('supertest');

jest.mock('../src/services/AuthService', () => ({
  registerUser: jest.fn(),
  loginUser: jest.fn(),
  verifyRefreshToken: jest.fn(),
  generateToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  getUserById: jest.fn(),
  verifyToken: jest.fn(),
}));

const AuthService = require('../src/services/AuthService');
const authRoutes = require('../src/routes/auth.routes');
const { errorHandlerMiddleware } = require('../src/middlewares/errorHandler.middleware');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use(errorHandlerMiddleware);
  return app;
}

describe('auth routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/auth/register returns 400 when email or password is missing', async () => {
    const app = buildApp();

    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'demo@example.com' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Cần email và mật khẩu');
    expect(AuthService.registerUser).not.toHaveBeenCalled();
  });

  test('POST /api/auth/login returns token payload on success', async () => {
    const app = buildApp();

    AuthService.loginUser.mockResolvedValue({
      id: 'user-1',
      email: 'demo@example.com',
    });
    AuthService.generateToken.mockReturnValue('token-123');
    AuthService.generateRefreshToken.mockReturnValue('refresh-123');

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@example.com', password: 'secret123' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      user: { id: 'user-1', email: 'demo@example.com' },
      token: 'token-123',
      refreshToken: 'refresh-123',
    });
    expect(AuthService.loginUser).toHaveBeenCalledWith('demo@example.com', 'secret123');
  });
});
