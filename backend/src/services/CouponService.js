const pool = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const CONSTANTS = require('../utils/constant');

class CouponService {
  /**
   * Validate coupon code
   */
  async validateCoupon(code) {
    try {
      const query = `
        SELECT * FROM coupons
        WHERE code = $1 AND status = 'active'
        AND datetime(valid_from) <= datetime('now')
        AND datetime(valid_until) >= datetime('now')
      `;

      logger.info(`Validating coupon: ${code.toUpperCase()} at ${new Date().toISOString()}`);
      const result = await pool.query(query, [code.toUpperCase()]);

      if (result.rows.length === 0) {
        // Try without date filter to see if it exists at all
        const exists = await pool.query('SELECT * FROM coupons WHERE code = $1', [code.toUpperCase()]);
        if (exists.rows.length > 0) {
           const c = exists.rows[0];
           logger.warn(`Coupon exists but failed filters: status=${c.status}, from=${c.valid_from}, until=${c.valid_until}`);
        } else {
           logger.warn(`Coupon not found at all: ${code.toUpperCase()}`);
        }

        return {
          valid: false,
          reason: 'Coupon not found or expired',
        };
      }

      const coupon = result.rows[0];

      // Check usage limit
      if (coupon.max_uses && coupon.usage_count >= coupon.max_uses) {
        return {
          valid: false,
          reason: 'Coupon usage limit reached',
        };
      }

      return {
        valid: true,
        couponId: coupon.id,
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
        minOrderAmount: coupon.min_order_amount,
        expiryDate: coupon.valid_until,
      };
    } catch (error) {
      logger.error('CouponService.validateCoupon error:', error);
      throw error;
    }
  }

  /**
   * Apply coupon and calculate discount
   */
  async applyCoupon(code, cartTotal) {
    try {
      const couponData = await this.validateCoupon(code);

      if (!couponData.valid) {
        throw new Error(couponData.reason);
      }

      // Check minimum order amount
      if (couponData.minOrderAmount && cartTotal < couponData.minOrderAmount) {
        throw new Error(
          `Minimum order amount is ${couponData.minOrderAmount} VND`
        );
      }

      // Calculate discount
      let discountAmount = 0;

      if (couponData.discountType === CONSTANTS.DISCOUNT_TYPE.PERCENTAGE) {
        discountAmount = (cartTotal * couponData.discountValue) / 100;
      } else if (couponData.discountType === CONSTANTS.DISCOUNT_TYPE.FIXED) {
        discountAmount = couponData.discountValue;
      }

      // Don't let discount exceed cart total
      discountAmount = Math.min(discountAmount, cartTotal);

      return {
        valid: true,
        couponId: couponData.couponId,
        couponCode: couponData.code,
        discountType: couponData.discountType,
        discountAmount: Math.round(discountAmount * 100) / 100,
        finalTotal: Math.round((cartTotal - discountAmount) * 100) / 100,
      };
    } catch (error) {
      logger.error('CouponService.applyCoupon error:', error);
      throw error;
    }
  }

  /**
   * Track coupon usage
   */
  async trackCouponUsage(couponId, orderId, discountAmount) {
    try {
      const usageId = uuidv4();
      const query = `
        INSERT INTO coupon_usages (id, coupon_id, order_id, applied_discount)
        VALUES ($1, $2, $3, $4)
      `;

      await pool.query(query, [
        usageId,
        couponId,
        orderId,
        discountAmount,
      ]);

      const result = await pool.query('SELECT * FROM coupon_usages WHERE id = $1', [usageId]);

      // Increment usage count
      await pool.query(
        'UPDATE coupons SET usage_count = usage_count + 1 WHERE id = $1',
        [couponId]
      );

      logger.info(`Coupon usage tracked: ${couponId}, order: ${orderId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('CouponService.trackCouponUsage error:', error);
      throw error;
    }
  }

  /**
   * Get active coupons (for marketing display)
   */
  async getActiveCoupons() {
    try {
      const query = `
        SELECT id, code, discount_type, discount_value, min_order_amount, valid_until
        FROM coupons
        WHERE status = 'active'
        AND valid_from <= CURRENT_TIMESTAMP
        AND valid_until >= CURRENT_TIMESTAMP
        ORDER BY valid_until DESC
        LIMIT 10
      `;

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('CouponService.getActiveCoupons error:', error);
      throw error;
    }
  }

  /**
   * Create coupon (admin only)
   */
  async createCoupon(couponData) {
    try {
      const {
        code, discountType, discountValue, maxUses = null,
        minOrderAmount = 0, validFrom, validUntil
      } = couponData;

      const couponId = uuidv4();
      const query = `
        INSERT INTO coupons (
          id, code, discount_type, discount_value, max_uses,
          min_order_amount, valid_from, valid_until, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
      `;

      await pool.query(query, [
        couponId,
        code.toUpperCase(),
        discountType,
        discountValue,
        maxUses,
        minOrderAmount,
        validFrom,
        validUntil,
      ]);

      const result = await pool.query('SELECT * FROM coupons WHERE id = $1', [couponId]);

      logger.info(`Coupon created: ${code}`);
      return result.rows[0];
    } catch (error) {
      logger.error('CouponService.createCoupon error:', error);
      throw error;
    }
  }

  /**
   * Update coupon (admin only)
   */
  async updateCoupon(couponId, updateData) {
    try {
      let query = 'UPDATE coupons SET ';
      const values = [];
      let paramCount = 1;

      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          query += `${key} = $${paramCount}, `;
          values.push(value);
          paramCount++;
        }
      });

      query += `updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount}`;
      values.push(couponId);

      await pool.query(query, values);
      const result = await pool.query('SELECT * FROM coupons WHERE id = $1', [couponId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('CouponService.updateCoupon error:', error);
      throw error;
    }
  }

  /**
   * Get coupons for admin (all statuses, with pagination)
   */
  async getCouponsForAdmin(limit = 50, offset = 0) {
    try {
      const query = `
        SELECT id, code, discount_type, discount_value, max_uses, usage_count,
               min_order_amount, valid_from, valid_until, status, created_at, updated_at
        FROM coupons
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const result = await pool.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('CouponService.getCouponsForAdmin error:', error);
      throw error;
    }
  }

  /**
   * Delete coupon (admin only)
   */
  async deleteCoupon(couponId) {
    try {
      const existing = await pool.query('SELECT * FROM coupons WHERE id = $1', [couponId]);
      const query = 'DELETE FROM coupons WHERE id = $1';
      await pool.query(query, [couponId]);
      const result = existing;
      logger.info(`Coupon deleted: ${couponId}`);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('CouponService.deleteCoupon error:', error);
      throw error;
    }
  }
}

module.exports = new CouponService();
