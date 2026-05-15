const pool = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const CONSTANTS = require('../utils/constant');
const ProductService = require('./ProductService');
const DeliveryWindowService = require('./DeliveryWindowService');

class OrderService {
  /**
   * Generate order number
   */
  generateOrderNumber() {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
    return `ORD-${dateStr}-${random}`;
  }

  /**
   * Create order from cart
   */
  async createOrder(userId, orderData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        cartItems,
        shippingAddress,
        shippingMethod,
        deliveryDate,
        deliveryTime,
        customNotes,
        couponCode,
        paymentMethod,
        discountAmount = 0,
      } = orderData;

      // Validate cart items
      if (!cartItems || cartItems.length === 0) {
        throw new Error(CONSTANTS.ERRORS.CART_EMPTY);
      }

      // Generate order number
      const orderNumber = this.generateOrderNumber();
      const orderId = uuidv4();

      // Validate delivery window
      if (cartItems.length > 0) {
        for (const item of cartItems) {
          const variant = await ProductService.getVariant(item.variantId);

          if (!variant) {
            throw new Error(`Variant not found: ${item.variantId}`);
          }

          const deliveryValidation = await DeliveryWindowService.validateDeliveryWindow(
            variant.product_id,
            deliveryDate,
            deliveryTime
          );

          if (!deliveryValidation.valid) {
            throw new Error(deliveryValidation.reason);
          }
        }
      }

      // Calculate order total
      let subtotal = 0;
      for (const item of cartItems) {
        const variant = await ProductService.getVariant(item.variantId);
        if (!variant) {
          throw new Error(`Variant not found: ${item.variantId}`);
        }

        subtotal += (parseFloat(variant.base_price) + parseFloat(variant.price_adjustment)) * item.quantity;
      }

      const shippingFee = shippingMethod === 'express' ? 50000 : 0;
      const totalAmount = subtotal + shippingFee - discountAmount;

      // Create order
      const orderQuery = `
        INSERT INTO orders (
          id, user_id, order_number, status, payment_method, payment_status,
          total_amount, shipping_fee, discount_amount,
          shipping_address, custom_notes, requested_delivery_date,
          requested_delivery_time, coupon_code
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      const status = process.env.DEMO_MODE === 'true' ? CONSTANTS.ORDER_STATUS.PAID : CONSTANTS.ORDER_STATUS.PENDING;
      const paymentStatus = process.env.DEMO_MODE === 'true' ? CONSTANTS.PAYMENT_STATUS.COMPLETED : CONSTANTS.PAYMENT_STATUS.PENDING;

      await client.query(orderQuery, [
        orderId, userId, orderNumber, status,
        paymentMethod, paymentStatus,
        totalAmount, shippingFee, discountAmount,
        JSON.stringify(shippingAddress), customNotes, deliveryDate,
        deliveryTime, couponCode,
      ]);

      const orderResult = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
      const order = orderResult.rows[0];

      // Create order items
      for (const item of cartItems) {
        const variant = await ProductService.getVariant(item.variantId);
        const itemPrice = parseFloat(variant.base_price) + parseFloat(variant.price_adjustment);

        const itemQuery = `
          INSERT INTO order_items (
            id, order_id, product_variant_id, product_name,
            quantity, unit_price, subtotal
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        await client.query(itemQuery, [
          uuidv4(), orderId, item.variantId,
          variant.product_name, item.quantity, itemPrice,
          itemPrice * item.quantity,
        ]);
      }

      await client.query('COMMIT');

      logger.info(`Order created: ${orderNumber}, user: ${userId}, amount: ${totalAmount}`);

      return {
        ...order,
        items: cartItems,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('OrderService.createOrder error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId) {
    try {
      const orderQuery = 'SELECT * FROM orders WHERE id = $1';
      const orderResult = await pool.query(orderQuery, [orderId]);

      if (orderResult.rows.length === 0) {
        return null;
      }

      const order = orderResult.rows[0];
      if (typeof order.shipping_address === 'string') {
        try {
          order.shipping_address = JSON.parse(order.shipping_address);
        } catch (e) {
          logger.warn('Failed to parse shipping_address JSON');
        }
      }

      // Get order items
      const itemsQuery = `
        SELECT oi.*, pv.size, pv.topping, pv.color
        FROM order_items oi
        JOIN product_variants pv ON oi.product_variant_id = pv.id
        WHERE oi.order_id = $1
      `;
      const itemsResult = await pool.query(itemsQuery, [orderId]);

      return {
        ...order,
        items: itemsResult.rows,
      };
    } catch (error) {
      logger.error('OrderService.getOrderById error:', error);
      throw error;
    }
  }

  /**
   * Get user orders
   */
  async getUserOrders(userId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT * FROM orders
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await pool.query(query, [userId, limit, offset]);
      return result.rows.map(order => {
        if (typeof order.shipping_address === 'string') {
          try {
            order.shipping_address = JSON.parse(order.shipping_address);
          } catch (e) {}
        }
        return order;
      });
    } catch (error) {
      logger.error('OrderService.getUserOrders error:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId, newStatus) {
    try {
      const query = `
        UPDATE orders
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      await pool.query(query, [newStatus, orderId]);
      const result = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);

      if (result.rows.length === 0) {
        throw new Error('Không tìm thấy đơn hàng');
      }

      logger.info(`Order status updated: ${orderId} -> ${newStatus}`);
      return result.rows[0];
    } catch (error) {
      logger.error('OrderService.updateOrderStatus error:', error);
      throw error;
    }
  }

  /**
   * Mark order as paid
   */
  async markOrderAsPaid(orderId, paymentInfo) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update order status
      const orderQuery = `
        UPDATE orders
        SET status = $1, payment_status = $2, paid_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;

      await client.query(orderQuery, [
        CONSTANTS.ORDER_STATUS.PAID,
        CONSTANTS.PAYMENT_STATUS.COMPLETED,
        orderId,
      ]);

      const orderResult = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);

      if (orderResult.rows.length === 0) {
        throw new Error('Không tìm thấy đơn hàng');
      }

      const order = orderResult.rows[0];

      // Reserve inventory for all items
      const itemsQuery = 'SELECT product_variant_id, quantity FROM order_items WHERE order_id = $1';
      const itemsResult = await client.query(itemsQuery, [orderId]);

      for (const item of itemsResult.rows) {
        const reserveQuery = `
          UPDATE product_variants
          SET stock_quantity = stock_quantity - $1
          WHERE id = $2
        `;
        await client.query(reserveQuery, [item.quantity, item.product_variant_id]);
      }

      // Track coupon usage if applied
      if (order.coupon_code) {
        // Coupon usage will be tracked by CouponService
      }

      await client.query('COMMIT');

      logger.info(`Order marked as paid: ${orderId}`);
      return order;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('OrderService.markOrderAsPaid error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId) {
    try {
      const query = `
        UPDATE orders
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND status != $3
        RETURNING *
      `;

      const result = await pool.query(query, [
        CONSTANTS.ORDER_STATUS.CANCELLED,
        orderId,
        CONSTANTS.ORDER_STATUS.SHIPPED,
      ]);

      if (result.rows.length === 0) {
        throw new Error('Không thể huỷ đơn ở trạng thái hiện tại');
      }

      logger.info(`Order cancelled: ${orderId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('OrderService.cancelOrder error:', error);
      throw error;
    }
  }

  /**
   * Get orders for admin dashboard
   */
  async getOrdersForAdmin(filters = {}) {
    try {
      const { status, startDate, endDate, limit = 50, offset = 0 } = filters;

      let query = 'SELECT * FROM orders WHERE 1=1';
      const params = [];
      let paramCount = 1;

      if (status) {
        query += ` AND status = $${paramCount}`;
        params.push(status);
        paramCount++;
      }

      if (startDate) {
        query += ` AND created_at >= $${paramCount}`;
        params.push(startDate);
        paramCount++;
      }

      if (endDate) {
        query += ` AND created_at <= $${paramCount}`;
        params.push(endDate);
        paramCount++;
      }

      if (filters.search) {
        query += ` AND (order_number LIKE $${paramCount} OR shipping_address LIKE $${paramCount})`;
        params.push(`%${filters.search}%`);
        paramCount++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      return result.rows.map(order => {
        if (typeof order.shipping_address === 'string') {
          try {
            order.shipping_address = JSON.parse(order.shipping_address);
          } catch (e) {}
        }
        return order;
      });
    } catch (error) {
      logger.error('OrderService.getOrdersForAdmin error:', error);
      throw error;
    }
  }

  /**
   * Get analytics stats for admin dashboard
   */
  async getAdminStats() {
    try {
      const totalRevenueQuery = "SELECT SUM(total_amount) as total FROM orders WHERE status = 'paid'";
      const totalOrdersQuery = "SELECT COUNT(*) as count FROM orders";
      const pendingOrdersQuery = "SELECT COUNT(*) as count FROM orders WHERE status = 'pending'";
      const todayRevenueQuery = "SELECT SUM(total_amount) as total FROM orders WHERE status = 'paid' AND created_at::date = CURRENT_DATE";
      
      const [revRes, countRes, pendingRes, todayRes] = await Promise.all([
        pool.query(totalRevenueQuery),
        pool.query(totalOrdersQuery),
        pool.query(pendingOrdersQuery),
        pool.query(todayRevenueQuery)
      ]);

      return {
        totalRevenue: parseFloat(revRes.rows[0].total || 0),
        totalOrders: parseInt(countRes.rows[0].count || 0),
        pendingOrders: parseInt(pendingRes.rows[0].count || 0),
        todayRevenue: parseFloat(todayRes.rows[0].total || 0)
      };
    } catch (error) {
      logger.error('OrderService.getAdminStats error:', error);
      throw error;
    }
  }
}

module.exports = new OrderService();
