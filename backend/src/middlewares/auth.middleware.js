const AuthService = require('../services/AuthService');
const logger = require('../utils/logger');

/**
 * JWT authentication middleware
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Thiếu header Authorization' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({ error: 'Định dạng token không hợp lệ' });
    }

    const decoded = AuthService.verifyToken(token);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    logger.warn(`Auth middleware error: ${error.message}`);
    res.status(401).json({ error: error.message });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
async function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.substring(7);
      const decoded = AuthService.verifyToken(token);
      req.userId = decoded.userId;
    }

    next();
  } catch (error) {
    // Optional - just continue
    next();
  }
}

/**
 * Admin role verification middleware
 */
async function adminMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Thiếu header Authorization' });
    }

    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({ error: 'Định dạng token không hợp lệ' });
    }

    const decoded = AuthService.verifyToken(token);
    req.userId = decoded.userId;

    // Check if user is admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@banhkem.com';
    const user = await AuthService.getUserById(req.userId);

    if (!user || user.email !== adminEmail) {
      return res.status(403).json({ error: 'Cần quyền quản trị' });
    }

    next();
  } catch (error) {
    logger.warn(`Admin middleware error: ${error.message}`);
    res.status(401).json({ error: error.message });
  }
}

/**
 * Test middleware
 */
function testMiddleware(req, res, next) {
  logger.debug(`[TEST] ${req.method} ${req.path}`);
  next();
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  adminMiddleware,
  testMiddleware,
};
