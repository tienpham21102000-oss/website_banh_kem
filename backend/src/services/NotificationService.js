const logger = require('../utils/logger');
const axios = require('axios');

class NotificationService {
  constructor() {
    this.sendgridApiKey = process.env.SENDGRID_API_KEY;
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@banhkem.com';
    this.sendgridUrl = 'https://api.sendgrid.com/v3/mail/send';
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmationEmail(order, user) {
    try {
      if (!this.sendgridApiKey) {
        logger.warn('SendGrid API key not configured. Email not sent (logging only)');
        return { sent: false, provider: 'log-only', reason: 'API key not configured' };
      }

      const orderDate = new Date(order.created_at).toLocaleDateString('vi-VN');
      const deliveryDate = order.requested_delivery_date || 'Chưa xác định';
      
      const htmlContent = `
        <h2>Đơn hàng của bạn đã được xác nhận</h2>
        <p>Cảm ơn bạn đã đặt hàng tại Bánh Kem Online!</p>
        
        <h3>Thông tin đơn hàng</h3>
        <p>
          <strong>Mã đơn:</strong> ${order.order_number}<br/>
          <strong>Ngày đặt:</strong> ${orderDate}<br/>
          <strong>Ngày giao dự kiến:</strong> ${deliveryDate}<br/>
          <strong>Tổng tiền:</strong> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount)}
        </p>

        <h3>Trạng thái thanh toán</h3>
        <p><strong>${order.payment_status === 'completed' ? 'Đã thanh toán' : 'Chưa thanh toán'}</strong></p>

        <p>Bạn sẽ nhận thêm thông báo cập nhật về đơn hàng của bạn.</p>
        <p>Liên hệ chúng tôi nếu có bất kỳ câu hỏi nào.</p>
      `;

      const payload = {
        personalizations: [
          {
            to: [{ email: user.email, name: user.display_name || user.email }],
            subject: `Xác nhận đơn hàng: ${order.order_number}`,
          },
        ],
        from: { email: this.fromEmail, name: 'Bánh Kem Online' },
        content: [
          {
            type: 'text/html',
            value: htmlContent,
          },
        ],
      };

      const response = await axios.post(this.sendgridUrl, payload, {
        headers: {
          Authorization: `Bearer ${this.sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      logger.info(`Order confirmation email sent to ${user.email}`);
      return { sent: true, provider: 'sendgrid', messageId: response.headers['x-message-id'] };
    } catch (error) {
      logger.error('NotificationService.sendOrderConfirmationEmail error:', error.message);
      return { sent: false, provider: 'sendgrid', error: error.message };
    }
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmationEmail(order, user) {
    try {
      if (!this.sendgridApiKey) {
        logger.warn('SendGrid API key not configured. Email not sent (logging only)');
        return { sent: false, provider: 'log-only', reason: 'API key not configured' };
      }

      const htmlContent = `
        <h2>Thanh toán thành công</h2>
        <p>Thanh toán cho đơn hàng của bạn đã được xác nhận.</p>
        
        <p>
          <strong>Mã đơn:</strong> ${order.order_number}<br/>
          <strong>Số tiền:</strong> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount)}<br/>
          <strong>Trạng thái:</strong> Đã thanh toán
        </p>

        <p>Đơn hàng của bạn sẽ sớm được xử lý.</p>
      `;

      const payload = {
        personalizations: [
          {
            to: [{ email: user.email, name: user.display_name || user.email }],
            subject: `Thanh toán thành công: ${order.order_number}`,
          },
        ],
        from: { email: this.fromEmail, name: 'Bánh Kem Online' },
        content: [
          {
            type: 'text/html',
            value: htmlContent,
          },
        ],
      };

      const response = await axios.post(this.sendgridUrl, payload, {
        headers: {
          Authorization: `Bearer ${this.sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      logger.info(`Payment confirmation email sent to ${user.email}`);
      return { sent: true, provider: 'sendgrid', messageId: response.headers['x-message-id'] };
    } catch (error) {
      logger.error('NotificationService.sendPaymentConfirmationEmail error:', error.message);
      return { sent: false, provider: 'sendgrid', error: error.message };
    }
  }

  /**
   * Send shipment notification email
   */
  async sendShipmentNotificationEmail(order, user, trackingNumber) {
    try {
      if (!this.sendgridApiKey) {
        logger.warn('SendGrid API key not configured. Email not sent (logging only)');
        return { sent: false, provider: 'log-only', reason: 'API key not configured' };
      }

      const htmlContent = `
        <h2>Đơn hàng của bạn đang được giao</h2>
        <p>Bánh kem của bạn đang trên đường tới bạn!</p>
        
        <p>
          <strong>Mã đơn:</strong> ${order.order_number}<br/>
          <strong>Số tracking:</strong> ${trackingNumber}<br/>
        </p>

        <p>Cảm ơn bạn đã mua hàng tại Bánh Kem Online!</p>
      `;

      const payload = {
        personalizations: [
          {
            to: [{ email: user.email, name: user.display_name || user.email }],
            subject: `Đơn hàng đang giao: ${order.order_number}`,
          },
        ],
        from: { email: this.fromEmail, name: 'Bánh Kem Online' },
        content: [
          {
            type: 'text/html',
            value: htmlContent,
          },
        ],
      };

      const response = await axios.post(this.sendgridUrl, payload, {
        headers: {
          Authorization: `Bearer ${this.sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      logger.info(`Shipment notification email sent to ${user.email}`);
      return { sent: true, provider: 'sendgrid', messageId: response.headers['x-message-id'] };
    } catch (error) {
      logger.error('NotificationService.sendShipmentNotificationEmail error:', error.message);
      return { sent: false, provider: 'sendgrid', error: error.message };
    }
  }
}

module.exports = new NotificationService();
