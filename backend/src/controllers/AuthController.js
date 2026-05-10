const AuthService = require('../services/AuthService');
const logger = require('../utils/logger');

/**
 * POST /api/auth/register - Register user
 */
async function register(req, res, next) {
  try {
    const { email, password, phone = '' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Cần email và mật khẩu' });
    }

    const user = await AuthService.registerUser(email, password, phone);

    // Generate tokens
    const token = AuthService.generateToken(user.id);
    const refreshToken = AuthService.generateRefreshToken(user.id);

    res.status(201).json({
      user,
      token,
      refreshToken,
    });
  } catch (error) {
    logger.warn(`Register error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
}

/**
 * POST /api/auth/login - Login user
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Cần email và mật khẩu' });
    }

    const user = await AuthService.loginUser(email, password);

    // Generate tokens
    const token = AuthService.generateToken(user.id);
    const refreshToken = AuthService.generateRefreshToken(user.id);

    res.json({
      user,
      token,
      refreshToken,
    });
  } catch (error) {
    logger.warn(`Login error: ${error.message}`);
    res.status(401).json({ error: error.message });
  }
}

/**
 * POST /api/auth/refresh - Refresh token
 */
async function refreshToken(req, res, next) {
  try {
    const { refreshToken: oldRefreshToken } = req.body;

    if (!oldRefreshToken) {
      return res.status(400).json({ error: 'Cần refresh token' });
    }

    const decoded = AuthService.verifyRefreshToken(oldRefreshToken);
    const userId = decoded.userId;

    // Generate new tokens
    const token = AuthService.generateToken(userId);
    const refreshToken = AuthService.generateRefreshToken(userId);

    res.json({
      token,
      refreshToken,
    });
  } catch (error) {
    logger.warn(`Refresh token error: ${error.message}`);
    res.status(401).json({ error: error.message });
  }
}

/**
 * GET /api/auth/me - Get current user
 */
async function getCurrentUser(req, res, next) {
  try {
    const { userId } = req;

    const user = await AuthService.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  refreshToken,
  getCurrentUser,
};
