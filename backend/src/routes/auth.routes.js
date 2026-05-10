const express = require('express');
const AuthController = require('../controllers/AuthController');
const OAuthController = require('../controllers/OAuthController');
const { authMiddleware } = require('../middlewares/auth.middleware');
const passport = require('passport');

const router = express.Router();

function ensureFacebookConfigured(req, res, next) {
  if (!passport?._strategy?.('facebook') && !passport?._strategies?.facebook) {
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
  const configured = !!(passport?._strategies?.facebook || passport?._strategy?.('facebook'));
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
  passport.authenticate('facebook', {
    failureRedirect: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/auth/facebook/callback?error=facebook_auth_failed',
  }),
  OAuthController.facebookCallback,
);

module.exports = router;
