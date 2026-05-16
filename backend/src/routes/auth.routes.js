const express = require('express');
const AuthController = require('../controllers/AuthController');
const OAuthController = require('../controllers/OAuthController');
const { authMiddleware } = require('../middlewares/auth.middleware');
const passport = require('passport');
const logger = require('../utils/logger');

const router = express.Router();
const pool = require('../config/database');

// Deduplication guard: each Facebook authorization code may only be used once.
// A Set keyed by the code value; entries are cleaned up after 2 minutes.
const _processedOAuthCodes = new Set();

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

// TUYEN DUONG TAM THOI DE CAP NHAT DATABASE - SE XOA SAU KHI XONG
router.get('/run-migration', async (req, res) => {
  try {
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}';");
    res.send('✅ THÀNH CÔNG: Đã cập nhật cơ sở dữ liệu! Bạn có thể đóng trang này.');
  } catch (error) {
    res.status(500).send('❌ LỖI: ' + error.message);
  }
});
router.get('/facebook', ensureFacebookConfigured, (req, res, next) => {
  passport.authenticate('facebook', { scope: ['public_profile'] })(req, res, next);
});
router.get(
  '/facebook/callback',
  function facebookErrorHandler(req, res, next) {
    // If Facebook returned an error (e.g. user denied permissions)
    if (req.query.error) {
      return res.redirect('/?error=' + encodeURIComponent(req.query.error));
    }
    // No code means direct browser access — nothing to process
    if (!req.query.code) {
      return res.redirect('/?error=no_authorization_code');
    }
    // Deduplication: reject a code that has already been submitted.
    // This prevents the "authorization code has been used" error that occurs
    // when the strategy verify callback is invoked more than once for the same
    // code (e.g. due to session middleware or concurrent browser requests).
    const code = req.query.code;
    if (_processedOAuthCodes.has(code)) {
      logger.warn('Facebook OAuth: duplicate authorization code detected, ignoring second request');
      return res.redirect('/?error=' + encodeURIComponent('Phiên đăng nhập đã xử lý, vui lòng thử lại'));
    }
    _processedOAuthCodes.add(code);
    setTimeout(() => _processedOAuthCodes.delete(code), 2 * 60 * 1000); // clean up after 2 min
    next();
  },
  ensureFacebookConfigured,
  function facebookCallbackHandler(req, res, next) {
    // Use the proper custom-callback form of passport.authenticate so passport
    // does NOT call req.logIn / serialize the user into the session (we use JWT).
    // Passing { session: false } AND a custom callback prevents the hybrid usage
    // pattern that can trigger the strategy's verify callback twice.
    passport.authenticate('facebook', { session: false }, function(err, user, info) {
      if (err) {
        logger.error(`Facebook auth error: ${err.message}, stack: ${err.stack}`);
        return res.redirect('/?error=' + encodeURIComponent(err.message));
      }
      if (!user) {
        logger.warn('Facebook auth: no user returned', info);
        return res.redirect('/?error=facebook_auth_failed');
      }
      req.user = user;
      OAuthController.facebookCallback(req, res, next);
    })(req, res, next);
  },
);

module.exports = router;
