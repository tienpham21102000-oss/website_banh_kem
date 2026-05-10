require('dotenv').config();

const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_USER: process.env.DB_USER || 'banh_kem_user',
  DB_PASSWORD: process.env.DB_PASSWORD || 'banh_kem_password',
  DB_NAME: process.env.DB_NAME || 'banh_kem_db',
  DATABASE_URL: process.env.DATABASE_URL || '',

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT || 6379,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'dev_jwt_secret_key',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // VNPay
  VNPAY_TMN_CODE: process.env.VNPAY_TMN_CODE || '',
  VNPAY_HASH_SECRET: process.env.VNPAY_HASH_SECRET || '',
  VNPAY_API_URL: process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn',
  VNPAY_RETURN_URL: process.env.VNPAY_RETURN_URL || 'http://localhost:5173/checkout/return',
  VNPAY_NOTIFY_URL: process.env.VNPAY_NOTIFY_URL || 'http://localhost:5000/api/payments/vnpay/ipn',

  // SendGrid
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || 'noreply@banhkem.com',

  // Facebook OAuth
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || '',
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET || '',
  FACEBOOK_CALLBACK_URL: process.env.FACEBOOK_CALLBACK_URL || '',

  // Features
  MIN_DELIVERY_ADVANCE_HOURS: parseInt(process.env.MIN_DELIVERY_ADVANCE_HOURS) || 48,
  CART_EXPIRY_DAYS: parseInt(process.env.CART_EXPIRY_DAYS) || 30,
  SESSION_EXPIRY_DAYS: parseInt(process.env.SESSION_EXPIRY_DAYS) || 7,

  // Admin
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@banhkem.com',
};

module.exports = env;
