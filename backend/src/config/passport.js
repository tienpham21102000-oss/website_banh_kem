const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const AuthService = require('../services/AuthService');
const logger = require('../utils/logger');

function configurePassport() {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;

  // Always configure serialize/deserialize regardless of Facebook config
  passport.serializeUser((user, done) => done(null, user?.id || null));
  passport.deserializeUser((id, done) => done(null, id ? { id } : null));

  if (!appId || !appSecret) {
    logger.warn('FACEBOOK_APP_ID or FACEBOOK_APP_SECRET not set. Facebook login will be unavailable.');
    return;
  }

  // Auto-detect public URL
  const publicUrl = process.env.API_BASE_URL
    || (process.env.RENDER_EXTERNAL_HOSTNAME ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` : null)
    || `http://localhost:${process.env.PORT || 5000}`;

  const callbackURL =
    process.env.FACEBOOK_CALLBACK_URL ||
    `${publicUrl}/api/auth/facebook/callback`;

  logger.info(`Facebook OAuth configured with callback URL: ${callbackURL}`);

  passport.use(
    new FacebookStrategy(
      {
        clientID: appId,
        clientSecret: appSecret,
        callbackURL,
        profileFields: ['id', 'displayName'],
        scope: [],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          logger.info(`Facebook profile received: id=${profile.id}, name=${profile.displayName}, hasEmail=${!!profile?.emails}`);
          const rawEmail = profile?.emails?.[0]?.value || null;
          const email = rawEmail || `facebook_${profile.id}@noemail.local`;
          const displayName = profile.displayName || (rawEmail ? rawEmail.split('@')[0] : `Facebook User ${profile.id}`);
          const user = await AuthService.findOrCreateOAuthUser({
            email,
            displayName,
            provider: 'facebook',
            providerUserId: profile.id,
          });
          return done(null, user);
        } catch (error) {
          logger.error(`Facebook auth error in strategy: ${error.message}`);
          return done(error);
        }
      },
    ),
  );

  return passport;
}

module.exports = { configurePassport };
