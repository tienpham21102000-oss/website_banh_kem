const express = require('express');
const AuthController = require('../controllers/AuthController');
const OAuthController = require('../controllers/OAuthController');
const { authMiddleware } = require('../middlewares/auth.middleware');
const passport = require('passport');
const logger = require('../utils/logger');

const router = express.Router();

function ensureFacebookConfigured(req, res, next) {
  const fbStrategy = passport?._strategies?.facebook;
  if (!fbStrategy) {
    return res.status(503).json({
      error: 'Chưa cấu hình đăng nhập Facebook. Vui lòng thiết lập FACEBOOK_APP_ID và FACEBOOK_APP_SECRET ở backend.',
    });
  }
  return next();
}

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refreshToken);
router.get('/me', authMiddleware, AuthController.getCurrentUser);

// Facebook OAuth
router.get('/facebook/status', (req, res) => {
  const configured = !!passport?._strategies?.facebook;
  res.json({
    configured,
    message: configured
      ? 'OK'
      : 'Chưa cấu hình đăng nhập Facebook. Vui lòng thiết lập FACEBOOK_APP_ID và FACEBOOK_APP_SECRET ở backend.',
  });
});
router.get('/facebook', ensureFacebookConfigured, passport.authenticate('facebook'));
router.get(
  '/facebook/callback',
  ensureFacebookConfigured,
  function facebookCallbackHandler(req, res, next) {
    // Auto-detect frontend URL from request
    const getFrontendUrl = () => {
      if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL.replace(/\/$/, '');
      // Force https in production (Render uses reverse proxy)
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : (req.protocol || 'http');
      const host = req.get('host') || 'banh-kem.onrender.com';
      return `${protocol}://${host}`;
    };

    const frontendUrl = getFrontendUrl();

    passport.authenticate('facebook', {
      failureRedirect: frontendUrl + '?error=facebook_auth_failed',
    })(req, res, function(err) {
      if (err) {
        logger.error(`Facebook auth error: ${err.message}`);
        return res.redirect(frontendUrl + '?error=' + encodeURIComponent(err.message));
      }
      OAuthController.facebookCallback(req, res, next);
    });
  },
);

module.exports = router;
