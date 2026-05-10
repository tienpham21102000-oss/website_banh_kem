const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const AuthService = require('../services/AuthService');

function ensureEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function configurePassport() {
  const appId = ensureEnv('FACEBOOK_APP_ID');
  const appSecret = ensureEnv('FACEBOOK_APP_SECRET');

  const callbackURL =
    process.env.FACEBOOK_CALLBACK_URL ||
    `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/auth/facebook/callback`;

  passport.use(
    new FacebookStrategy(
      {
        clientID: appId,
        clientSecret: appSecret,
        callbackURL,
        profileFields: ['id', 'displayName', 'emails'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile?.emails?.[0]?.value || null;
          if (!email) {
            return done(
              null,
              null,
              new Error('Tài khoản Facebook chưa cấp quyền Email. Vui lòng cho phép truy cập Email và thử lại.'),
            );
          }

          const displayName = profile.displayName || email.split('@')[0];
          const user = await AuthService.findOrCreateOAuthUser({
            email,
            displayName,
            provider: 'facebook',
            providerUserId: profile.id,
          });
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      },
    ),
  );

  passport.serializeUser((user, done) => done(null, user?.id || null));
  passport.deserializeUser((id, done) => done(null, id ? { id } : null));

  return passport;
}

module.exports = { configurePassport };

