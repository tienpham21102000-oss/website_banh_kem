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
router.get('/facebook', ensureFacebookConfigured, (req, res, next) => {
  passport.authenticate('facebook', { scope: ['public_profile'] })(req, res, next);
});
router.get(
  '/facebook/callback',
  function facebookErrorHandler(req, res, next) {
    // If there's already an error parameter (from a previous failed attempt),
    // skip passport and redirect to frontend with the error
    if (req.query.error) {
      return res.redirect('/?error=' + encodeURIComponent(req.query.error));
    }
    // Skip passport authenticate if there's no code (e.g. direct browser access)
    if (!req.query.code) {
      return res.redirect('/?error=no_authorization_code');
    }
    next();
  },
  ensureFacebookConfigured,
  function facebookCallbackHandler(req, res, next) {
    passport.authenticate('facebook', {
      failureRedirect: '/?error=facebook_auth_failed',
    })(req, res, function(err) {
      if (err) {
        logger.error(`Facebook auth error: ${err.message}, stack: ${err.stack}`);
        return res.redirect('/?error=' + encodeURIComponent(err.message));
      }
      OAuthController.facebookCallback(req, res, next);
    });
  },
);

module.exports = router;
