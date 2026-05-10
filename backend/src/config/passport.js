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
        profileFields: ['id', 'displayName'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const rawEmail = profile?.emails?.[0]?.value || null;
          // Some Facebook accounts/apps may not return email (or the email permission is ignored).
          // To keep the ordering flow working, fall back to a synthetic email based on Facebook user id.
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
