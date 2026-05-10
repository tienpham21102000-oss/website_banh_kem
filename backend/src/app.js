// Ensure environment variables are loaded
require('./config/env');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const logger = require('./utils/logger');
const { errorHandlerMiddleware } = require('./middlewares/errorHandler.middleware');
const { configurePassport } = require('./config/passport');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : true)
    : ['http://localhost:3000', 'http://localhost:5173', process.env.FRONTEND_URL].filter(Boolean),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session (required for OAuth redirects)
app.use(
  session({
    name: 'bk.sid',
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'dev_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 15, // 15 minutes (OAuth handshake only)
    },
  }),
);

// Passport OAuth
try {
  configurePassport();
  app.use(require('passport').initialize());
  app.use(require('passport').session());
} catch (error) {
  // Allow server to run without OAuth env vars (Facebook login will be unavailable)
  logger.warn(`Passport OAuth not configured: ${error.message}`);
}

// Request logging
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const path = require('path');

// API Routes
app.use('/api/products', require('./routes/products.routes'));
app.use('/api/cart', require('./routes/cart.routes'));
app.use('/api/orders', require('./routes/orders.routes'));
app.use('/api/payments', require('./routes/payments.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/coupons', require('./routes/coupons.routes'));
app.use('/api/delivery', require('./routes/delivery.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Serve Static Frontend in Production
if (process.env.NODE_ENV === 'production' || true) { // Forced true for easier deployment testing
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Không tìm thấy đường dẫn' });
});

// Error handler
app.use(errorHandlerMiddleware);

module.exports = app;
