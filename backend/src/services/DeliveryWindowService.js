const pool = require('../config/database');
const logger = require('../utils/logger');
const CONSTANTS = require('../utils/constant');

class DeliveryWindowService {
  /**
   * Get available delivery slots for a product
   */
  async getAvailableSlots(productId) {
    try {
      // Get product's min advance hours
      const productQuery = 'SELECT min_advance_hours FROM products WHERE id = $1';
      const productResult = await pool.query(productQuery, [productId]);

      if (productResult.rows.length === 0) {
        throw new Error('Không tìm thấy sản phẩm');
      }

      const minAdvanceHours = productResult.rows[0].min_advance_hours;

      // Get blackout dates
      const blackoutQuery = `
        SELECT date_start, date_end FROM blackout_dates
        WHERE date_start <= datetime('now', '+90 days')
        ORDER BY date_start ASC
      `;
      const blackoutResult = await pool.query(blackoutQuery);
      const blackoutDates = blackoutResult.rows.map(row => ({
        start: new Date(row.date_start),
        end: new Date(row.date_end),
      }));

      // Calculate available dates (next 30 days)
      const availableDates = [];
      const now = new Date();
      const earliestDate = new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000);

      for (let i = 0; i < 30; i++) {
        const date = new Date(earliestDate);
        date.setDate(date.getDate() + i);

        // Check if date is blackout
        const isBlackout = blackoutDates.some(
          blackout => date >= blackout.start && date < blackout.end
        );

        if (!isBlackout) {
          availableDates.push(date.toISOString().split('T')[0]);
        }
      }

      const availableSlotsByDate = availableDates.reduce((acc, date) => {
        acc[date] = CONSTANTS.DELIVERY_TIME_SLOTS;
        return acc;
      }, {});

      return {
        availableSlotsByDate,
        minAdvanceHours,
      };
    } catch (error) {
      logger.error('DeliveryWindowService.getAvailableSlots error:', error);
      throw error;
    }
  }

  /**
   * Validate delivery window
   */
  async validateDeliveryWindow(productId, requestedDate, requestedTime) {
    try {
      // Get min advance hours
      const productQuery = 'SELECT min_advance_hours FROM products WHERE id = $1';
      const productResult = await pool.query(productQuery, [productId]);

      if (productResult.rows.length === 0) {
        throw new Error('Không tìm thấy sản phẩm');
      }

      const minAdvanceHours = productResult.rows[0].min_advance_hours;

      // Validate time slot
      if (!CONSTANTS.DELIVERY_TIME_SLOTS.includes(requestedTime)) {
        return {
          valid: false,
          reason: 'Khung giờ giao hàng không hợp lệ',
        };
      }

      // Parse requested date
      const requested = new Date(requestedDate + 'T00:00:00');
      const now = new Date();
      const deadline = new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000);

      // Check if requested date is before deadline
      if (requested < deadline) {
        return {
          valid: false,
          reason: `Đơn hàng cần đặt trước ít nhất ${minAdvanceHours} giờ`,
          deadline: deadline.toISOString(),
        };
      }

      // Check if date is blackout
      const blackoutQuery = `
        SELECT COUNT(*) as count FROM blackout_dates
        WHERE date($1) >= date(date_start) AND date($1) < date(date_end, '+1 day')
      `;
      const blackoutResult = await pool.query(blackoutQuery, [requested]);

      if (blackoutResult.rows[0].count > 0) {
        return {
          valid: false,
          reason: 'Ngày bạn chọn hiện không khả dụng',
        };
      }

      return {
        valid: true,
        requestedDate,
        requestedTime,
      };
    } catch (error) {
      logger.error('DeliveryWindowService.validateDeliveryWindow error:', error);
      throw error;
    }
  }

  /**
   * Add blackout date (admin only)
   */
  async addBlackoutDate(dateStart, dateEnd, reason = '') {
    try {
      const { v4: uuidv4 } = require('uuid');
      const query = `
        INSERT INTO blackout_dates (id, date_start, date_end, reason)
        VALUES ($1, $2, $3, $4)
      `;

      await pool.query(query, [uuidv4(), dateStart, dateEnd, reason]);
      const result = await pool.query('SELECT * FROM blackout_dates WHERE date_start = $1 AND date_end = $2', [dateStart, dateEnd]);
      logger.info(`Blackout date added: ${dateStart} to ${dateEnd}`);
      return result.rows[0];
    } catch (error) {
      logger.error('DeliveryWindowService.addBlackoutDate error:', error);
      throw error;
    }
  }

  /**
   * Get blackout dates
   */
  async getBlackoutDates() {
    try {
      const query = `
        SELECT * FROM blackout_dates
        WHERE date_end >= CURRENT_TIMESTAMP
        ORDER BY date_start ASC
      `;

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('DeliveryWindowService.getBlackoutDates error:', error);
      throw error;
    }
  }

  /**
   * Remove blackout date (admin only)
   */
  async removeBlackoutDate(blackoutDateId) {
    try {
      const query = 'DELETE FROM blackout_dates WHERE id = $1';
      await pool.query(query, [blackoutDateId]);
      logger.info(`Blackout date removed: ${blackoutDateId}`);
      return true;
    } catch (error) {
      logger.error('DeliveryWindowService.removeBlackoutDate error:', error);
      throw error;
    }
  }
}

module.exports = new DeliveryWindowService();
