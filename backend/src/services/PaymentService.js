const pool = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const CONSTANTS = require('../utils/constant');

class PaymentService {
  /**
   * Create payment record
   */
  async createPayment(orderId, amount, paymentMethod, gateway) {
    try {
      const query = `
        INSERT INTO payments (id, order_id, gateway, amount, currency, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const result = await pool.query(query, [
        uuidv4(),
        orderId,
        gateway,
        amount,
        'VND',
        CONSTANTS.PAYMENT_STATUS.PENDING,
      ]);

      logger.info(`Payment created: ${result.rows[0].id}, order: ${orderId}, amount: ${amount}`);
      return result.rows[0];
    } catch (error) {
      logger.error('PaymentService.createPayment error:', error);
      throw error;
    }
  }

  /**
   * Build VNPay payment URL
   */
  buildVNPayUrl(orderId, amount, orderInfo) {
    try {
      const tmnCode = process.env.VNPAY_TMN_CODE;
      const hashSecret = process.env.VNPAY_HASH_SECRET;
      const vnpayUrl = process.env.VNPAY_API_URL;
      const returnUrl = process.env.VNPAY_RETURN_URL;
      const notifyUrl = process.env.VNPAY_NOTIFY_URL;

      if (!tmnCode || !hashSecret) {
        throw new Error('Chưa cấu hình VNPay (TMN_CODE/HASH_SECRET)');
      }

      // Create request params
      const date = new Date();
      const createDate = this.formatTimestamp(date);
      const expireDate = this.formatTimestamp(new Date(date.getTime() + 15 * 60 * 1000)); // 15 mins

      const params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: '100000',
        vnp_Amount: (amount * 100).toString(), // VNPay expects amount * 100
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: '127.0.0.1', // Should be replaced with actual IP
        vnp_CreateDate: createDate,
        vnp_ExpireDate: expireDate,
        vnp_NotifyUrl: notifyUrl,
      };

      // Sort params and build secure hash
      const secureHash = this.buildSecureHash(params, hashSecret);
      params.vnp_SecureHash = secureHash;
      params.vnp_SecureHashType = 'SHA512';

      // Build URL
      const query = Object.keys(params)
        .sort()
        .map(key => `${key}=${encodeURIComponent(params[key])}`)
        .join('&');

      const redirectUrl = `${vnpayUrl}/paymentv2/vpcpay.html?${query}`;

      logger.info(`VNPay URL built for order: ${orderId}`);
      return redirectUrl;
    } catch (error) {
      logger.error('PaymentService.buildVNPayUrl error:', error);
      throw error;
    }
  }

  /**
   * Validate VNPay IPN
   */
  validateVNPayIPN(params) {
    try {
      const hashSecret = process.env.VNPAY_HASH_SECRET;
      const receivedHash = params.vnp_SecureHash;

      // Create secure hash from params
      const { vnp_SecureHash, vnp_SecureHashType, ...verifyParams } = params;
      const calculatedHash = this.buildSecureHash(verifyParams, hashSecret);

      const isValid = receivedHash === calculatedHash;

      if (!isValid) {
        logger.warn('VNPay IPN signature validation failed');
      }

      return isValid;
    } catch (error) {
      logger.error('PaymentService.validateVNPayIPN error:', error);
      throw error;
    }
  }

  /**
   * Handle VNPay IPN
   */
  async handleVNPayIPN(params) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validate signature
      if (!this.validateVNPayIPN(params)) {
        return { RspCode: '97', Message: 'Invalid signature' };
      }

      const txnRef = params.vnp_TransactionNo;
      const responseCode = params.vnp_ResponseCode;

      // Check if payment already processed (idempotency)
      const existingQuery = `
        SELECT * FROM payments
        WHERE gateway_transaction_id = $1
      `;
      const existingResult = await client.query(existingQuery, [txnRef]);

      if (existingResult.rows.length > 0) {
        logger.info(`Payment already processed: ${txnRef}`);
        return { RspCode: '00', Message: 'Confirm Success' };
      }

      // Get order
      const orderQuery = 'SELECT * FROM orders WHERE id = $1';
      const orderResult = await client.query(orderQuery, [params.vnp_TxnRef]);

      if (orderResult.rows.length === 0) {
        return { RspCode: '01', Message: 'Order not found' };
      }

      const order = orderResult.rows[0];

      if (responseCode === CONSTANTS.VNPAY_RESPONSE_CODE.SUCCESS) {
        // Update payment
        const updatePaymentQuery = `
          UPDATE payments
          SET gateway_transaction_id = $1, status = $2, response_code = $3, received_at = CURRENT_TIMESTAMP
          WHERE order_id = $4
          RETURNING *
        `;

        await client.query(updatePaymentQuery, [
          txnRef,
          CONSTANTS.PAYMENT_STATUS.COMPLETED,
          responseCode,
          params.vnp_TxnRef,
        ]);

        // Update order status
        const updateOrderQuery = `
          UPDATE orders
          SET status = $1, payment_status = $2, paid_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `;

        await client.query(updateOrderQuery, [
          CONSTANTS.ORDER_STATUS.PAID,
          CONSTANTS.PAYMENT_STATUS.COMPLETED,
          params.vnp_TxnRef,
        ]);

        // Reserve inventory
        const itemsQuery = 'SELECT product_variant_id, quantity FROM order_items WHERE order_id = $1';
        const itemsResult = await client.query(itemsQuery, [params.vnp_TxnRef]);

        for (const item of itemsResult.rows) {
          const reserveQuery = `
            UPDATE product_variants
            SET stock_quantity = stock_quantity - $1
            WHERE id = $2
          `;
          await client.query(reserveQuery, [item.quantity, item.product_variant_id]);
        }

        logger.info(`Payment confirmed from VNPay: ${txnRef}, order: ${params.vnp_TxnRef}`);

        await client.query('COMMIT');
        return { RspCode: '00', Message: 'Confirm Success' };
      } else {
        // Payment failed
        const updatePaymentQuery = `
          UPDATE payments
          SET gateway_transaction_id = $1, status = $2, response_code = $3
          WHERE order_id = $4
        `;

        await client.query(updatePaymentQuery, [
          txnRef,
          CONSTANTS.PAYMENT_STATUS.FAILED,
          responseCode,
          params.vnp_TxnRef,
        ]);

        const updateOrderQuery = `
          UPDATE orders
          SET payment_status = $1
          WHERE id = $2
        `;

        await client.query(updateOrderQuery, [
          CONSTANTS.PAYMENT_STATUS.FAILED,
          params.vnp_TxnRef,
        ]);

        logger.warn(`Payment failed from VNPay: ${txnRef}, code: ${responseCode}`);

        await client.query('COMMIT');
        return { RspCode: '00', Message: 'Confirm Success' };
      }
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('PaymentService.handleVNPayIPN error:', error);
      return { RspCode: '99', Message: 'Unknown error' };
    } finally {
      client.release();
    }
  }

  /**
   * Build HMAC-SHA512 secure hash
   */
  buildSecureHash(params, hashSecret) {
    const sortedKeys = Object.keys(params).sort();
    let signData = '';

    for (const key of sortedKeys) {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        signData += key + '=' + encodeURIComponent(params[key]) + '&';
      }
    }

    signData = signData.slice(0, -1);

    const hash = crypto
      .createHmac('sha512', hashSecret)
      .update(signData)
      .digest('hex');

    return hash;
  }

  /**
   * Format timestamp for VNPay (YYYYMMDDHHmmss)
   */
  formatTimestamp(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Get payment by order
   */
  async getPaymentByOrder(orderId) {
    try {
      const query = 'SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1';
      const result = await pool.query(query, [orderId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('PaymentService.getPaymentByOrder error:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();
