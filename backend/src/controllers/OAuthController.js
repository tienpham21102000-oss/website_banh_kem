const AuthService = require('../services/AuthService');
const logger = require('../utils/logger');

function getFrontendUrl(req) {
  // If FRONTEND_URL is set, use it (strip trailing slash)
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL.replace(/\/$/, '');
  // Otherwise detect from the incoming request (works on Render)
  if (req) {
    // Force https in production (Render uses reverse proxy)
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : (req.protocol || 'http');
    const host = req.get('host') || 'banh-kem.onrender.com';
    return `${protocol}://${host}`;
  }
  return 'https://banh-kem.onrender.com';
}

function buildRedirectUrl(req, { token, refreshToken, error }) {
  const base = `${getFrontendUrl(req)}/auth/facebook/callback`;
  const params = new URLSearchParams();
  if (token) params.set('token', token);
  if (refreshToken) params.set('refreshToken', refreshToken);
  if (error) params.set('error', error);
  return `${base}?${params.toString()}`;
}

async function facebookCallback(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.redirect(buildRedirectUrl(req, { error: 'Đăng nhập Facebook thất bại. Vui lòng thử lại.' }));
    }

    const token = AuthService.generateToken(user.id);
    const refreshToken = AuthService.generateRefreshToken(user.id);

    return res.redirect(buildRedirectUrl(req, { token, refreshToken }));
  } catch (error) {
    logger.warn(`Facebook callback error: ${error.message}`);
    return res.redirect(buildRedirectUrl(req, { error: 'Không thể xử lý đăng nhập Facebook. Vui lòng thử lại.' }));
  }
}

module.exports = {
  facebookCallback,
};

