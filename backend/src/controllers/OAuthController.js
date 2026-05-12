const AuthService = require('../services/AuthService');
const logger = require('../utils/logger');

function buildRedirectUrl({ token, refreshToken, error }) {
  const params = new URLSearchParams();
  if (token) params.set('token', token);
  if (refreshToken) params.set('refreshToken', refreshToken);
  if (error) params.set('error', error);
  // Redirect to frontend route — Express catch-all '*' will serve index.html
  // React SPA will parse params via FacebookAuthCallback component
  return `/auth/facebook/callback?${params.toString()}`;
}

async function facebookCallback(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.redirect(buildRedirectUrl({ error: 'Đăng nhập Facebook thất bại. Vui lòng thử lại.' }));
    }

    const token = AuthService.generateToken(user.id);
    const refreshToken = AuthService.generateRefreshToken(user.id);

    return res.redirect(buildRedirectUrl({ token, refreshToken }));
  } catch (error) {
    logger.warn(`Facebook callback error: ${error.message}`);
    return res.redirect(buildRedirectUrl({ error: 'Không thể xử lý đăng nhập Facebook. Vui lòng thử lại.' }));
  }
}

module.exports = {
  facebookCallback,
};