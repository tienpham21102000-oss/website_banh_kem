const pool = require('../config/database');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class AuthService {
  /**
   * Hash password
   */
  async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(10);
      return bcrypt.hash(password, salt);
    } catch (error) {
      logger.error('AuthService.hashPassword error:', error);
      throw error;
    }
  }

  /**
   * Compare passwords
   */
  async comparePasswords(password, hash) {
    try {
      return bcrypt.compare(password, hash);
    } catch (error) {
      logger.error('AuthService.comparePasswords error:', error);
      throw error;
    }
  }

  /**
   * Register user
   */
  async registerUser(email, password, phone = '') {
    try {
      // Check if user exists
      const existsQuery = 'SELECT * FROM users WHERE email = $1 OR phone = $2';
      const existsResult = await pool.query(existsQuery, [email, phone]);

      if (existsResult.rows.length > 0) {
        throw new Error('Email hoặc số điện thoại đã được đăng ký');
      }

      // Hash password
      const passwordHash = await this.hashPassword(password);

      // Create user
      const userId = uuidv4();
      const query = `
        INSERT INTO users (id, email, phone, password_hash, display_name)
        VALUES ($1, $2, $3, $4, $5)
      `;

      await pool.query(query, [
        userId, email, phone, passwordHash, email.split('@')[0]
      ]);

      const result = await pool.query('SELECT id, email, phone, display_name, verified_email, verified_phone FROM users WHERE id = $1', [userId]);

      logger.info(`User registered: ${email}`);
      return result.rows[0];
    } catch (error) {
      logger.error('AuthService.registerUser error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async loginUser(email, password) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await pool.query(query, [email]);

      if (result.rows.length === 0) {
        throw new Error('Email hoặc mật khẩu không đúng');
      }

      const user = result.rows[0];

      // Compare password
      const isPasswordValid = await this.comparePasswords(password, user.password_hash);

      if (!isPasswordValid) {
        throw new Error('Email hoặc mật khẩu không đúng');
      }

      logger.info(`User logged in: ${email}`);

      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        displayName: user.display_name,
        verifiedEmail: user.verified_email,
        verifiedPhone: user.verified_phone,
      };
    } catch (error) {
      logger.error('AuthService.loginUser error:', error);
      throw error;
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(userId, expiresIn = process.env.JWT_EXPIRES_IN) {
    try {
      const token = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn }
      );
      return token;
    } catch (error) {
      logger.error('AuthService.generateToken error:', error);
      throw error;
    }
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId) {
    try {
      const token = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
      );
      return token;
    } catch (error) {
      logger.error('AuthService.generateRefreshToken error:', error);
      throw error;
    }
  }

  /**
   * Verify token
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (error) {
      if (error instanceof jwt.ExpiredSignatureError) {
        throw new Error('Token đã hết hạn');
      }
      throw new Error('Token không hợp lệ');
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      return decoded;
    } catch (error) {
      throw new Error('Refresh token không hợp lệ');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      const query = `
        SELECT id, email, phone, display_name, verified_email, verified_phone, loyalty_points, created_at
        FROM users
        WHERE id = $1
      `;
      const result = await pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('AuthService.getUserById error:', error);
      throw error;
    }
  }

  /**
   * Find or create a user from an OAuth provider (Facebook/Google/etc.)
   * Notes:
   * - We keep schema unchanged by using email as primary lookup key.
   * - password_hash can be NULL for OAuth users.
   */
  async findOrCreateOAuthUser({ email, displayName, provider, providerUserId }) {
    try {
      const existing = await pool.query(
        'SELECT id, email, phone, display_name, verified_email, verified_phone FROM users WHERE email = $1',
        [email],
      );

      if (existing.rows.length > 0) {
        const user = existing.rows[0];
        return {
          id: user.id,
          email: user.email,
          phone: user.phone,
          displayName: user.display_name,
          verifiedEmail: user.verified_email,
          verifiedPhone: user.verified_phone,
          provider,
          providerUserId,
        };
      }

      const userId = uuidv4();
      const query = `
        INSERT INTO users (id, email, phone, password_hash, display_name, verified_email)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;

      await pool.query(query, [userId, email, null, null, displayName || email.split('@')[0], true]);

      const created = await pool.query(
        'SELECT id, email, phone, display_name, verified_email, verified_phone FROM users WHERE id = $1',
        [userId],
      );

      return {
        id: created.rows[0].id,
        email: created.rows[0].email,
        phone: created.rows[0].phone,
        displayName: created.rows[0].display_name,
        verifiedEmail: created.rows[0].verified_email,
        verifiedPhone: created.rows[0].verified_phone,
        provider,
        providerUserId,
      };
    } catch (error) {
      logger.error('AuthService.findOrCreateOAuthUser error:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();
