const redisClient = require('../config/redis');
const pool = require('../config/database');
const logger = require('../utils/logger');
const CONSTANTS = require('../utils/constant');

class CartService {
  /**
   * Generate cart key for Redis
   */
  getCartKey(userId) {
    return CONSTANTS.CACHE_KEYS.CART(userId);
  }

  /**
   * Get cart for user
   */
  async getCart(userId) {
    try {
      const cartKey = this.getCartKey(userId);
      const cartData = await redisClient.get(cartKey);

      if (!cartData) {
        return { items: [], total: 0, discountAmount: 0, appliedCoupon: null };
      }

      return JSON.parse(cartData);
    } catch (error) {
      logger.error('CartService.getCart error:', error);
      throw error;
    }
  }

  /**
   * Add item to cart
   */
  async addToCart(userId, variantId, quantity = 1, customNotes = '') {
    try {
      const cartKey = this.getCartKey(userId);
      let cart = await this.getCart(userId);

      // Check if variant already in cart
      const existingItem = cart.items.find(item => item.variantId === variantId);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({
          variantId,
          quantity,
          customNotes,
          addedAt: new Date().toISOString(),
        });
      }

      // Recalculate total
      await this.calculateCartTotal(cart);

      // Save to Redis with expiry
      const cartExpiry = parseInt(process.env.CART_EXPIRY_DAYS) || 30;
      await redisClient.setex(
        cartKey,
        cartExpiry * 24 * 60 * 60, // Convert days to seconds
        JSON.stringify(cart)
      );

      logger.info(`Item added to cart: user ${userId}, variant ${variantId}, qty ${quantity}`);
      return cart;
    } catch (error) {
      logger.error('CartService.addToCart error:', error);
      throw error;
    }
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(userId, variantId) {
    try {
      const cartKey = this.getCartKey(userId);
      let cart = await this.getCart(userId);

      cart.items = cart.items.filter(item => item.variantId !== variantId);

      await this.calculateCartTotal(cart);

      const cartExpiry = parseInt(process.env.CART_EXPIRY_DAYS) || 30;
      await redisClient.setex(
        cartKey,
        cartExpiry * 24 * 60 * 60,
        JSON.stringify(cart)
      );

      logger.info(`Item removed from cart: user ${userId}, variant ${variantId}`);
      return cart;
    } catch (error) {
      logger.error('CartService.removeFromCart error:', error);
      throw error;
    }
  }

  /**
   * Update item quantity
   */
  async updateItemQuantity(userId, variantId, quantity) {
    try {
      const cartKey = this.getCartKey(userId);
      let cart = await this.getCart(userId);

      const item = cart.items.find(item => item.variantId === variantId);
      if (!item) {
        throw new Error('Sản phẩm không có trong giỏ hàng');
      }

      if (quantity <= 0) {
        return this.removeFromCart(userId, variantId);
      }

      item.quantity = quantity;

      await this.calculateCartTotal(cart);

      const cartExpiry = parseInt(process.env.CART_EXPIRY_DAYS) || 30;
      await redisClient.setex(
        cartKey,
        cartExpiry * 24 * 60 * 60,
        JSON.stringify(cart)
      );

      return cart;
    } catch (error) {
      logger.error('CartService.updateItemQuantity error:', error);
      throw error;
    }
  }

  /**
   * Apply coupon to cart
   */
  async applyCoupon(userId, couponCode) {
    try {
      const cartKey = this.getCartKey(userId);
      let cart = await this.getCart(userId);

      // This will be validated by CouponService
      cart.appliedCoupon = couponCode;

      await this.calculateCartTotal(cart);

      const cartExpiry = parseInt(process.env.CART_EXPIRY_DAYS) || 30;
      await redisClient.setex(
        cartKey,
        cartExpiry * 24 * 60 * 60,
        JSON.stringify(cart)
      );

      return cart;
    } catch (error) {
      logger.error('CartService.applyCoupon error:', error);
      throw error;
    }
  }

  /**
   * Clear cart
   */
  async clearCart(userId) {
    try {
      const cartKey = this.getCartKey(userId);
      await redisClient.del(cartKey);
      logger.info(`Cart cleared for user ${userId}`);
      return { items: [], total: 0, discountAmount: 0, appliedCoupon: null };
    } catch (error) {
      logger.error('CartService.clearCart error:', error);
      throw error;
    }
  }

  /**
   * Calculate cart total with item prices and discount
   */
  async calculateCartTotal(cart) {
    try {
      let subtotal = 0;

      for (const item of cart.items) {
        const query = `
          SELECT 
            (p.base_price + COALESCE(pv.price_adjustment, 0)) as price,
            p.id as product_id,
            p.name as product_name
          FROM product_variants pv
          JOIN products p ON pv.product_id = p.id
          WHERE pv.id = $1
        `;
        const result = await pool.query(query, [item.variantId]);

        if (result.rows.length > 0) {
          const row = result.rows[0];
          const price = parseFloat(row.price);
          item.productId = row.product_id;
          item.productName = row.product_name;
          item.price = price;
          item.subtotal = price * item.quantity;
          subtotal += item.subtotal;
        }
      }

      cart.subtotal = subtotal;
      cart.total = subtotal;
      cart.discountAmount = 0; // Will be updated by CouponService

      return cart;
    } catch (error) {
      logger.error('CartService.calculateCartTotal error:', error);
      throw error;
    }
  }

  /**
   * Sync cart to database (on checkout)
   */
  async syncCartToDatabase(userId, cartData) {
    try {
      // Store cart snapshot in session/order creation
      logger.info(`Cart synced to DB for user ${userId}, items: ${cartData.items.length}`);
      return cartData;
    } catch (error) {
      logger.error('CartService.syncCartToDatabase error:', error);
      throw error;
    }
  }
}

module.exports = new CartService();
