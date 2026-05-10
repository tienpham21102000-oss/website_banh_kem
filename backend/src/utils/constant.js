const CONSTANTS = {
  // Order Status
  ORDER_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PAID: 'paid',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
  },

  // Payment Status
  PAYMENT_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
  },

  // Payment Methods
  PAYMENT_METHOD: {
    VNPAY: 'vnpay',
    MOMO: 'momo',
    COD: 'cod',
    BANK_TRANSFER: 'bank_transfer',
  },

  // Payment Gateway
  PAYMENT_GATEWAY: {
    VNPAY: 'vnpay',
    MOMO: 'momo',
    STRIPE: 'stripe',
  },

  // Coupon Discount Type
  DISCOUNT_TYPE: {
    PERCENTAGE: 'percentage',
    FIXED: 'fixed',
  },

  // Address Type
  ADDRESS_TYPE: {
    HOME: 'home',
    OFFICE: 'office',
  },

  // Delivery Time Slots
  DELIVERY_TIME_SLOTS: ['morning', 'afternoon', 'evening'],

  // Product Status
  PRODUCT_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    DISCONTINUED: 'discontinued',
  },

  // VNPay Response Code
  VNPAY_RESPONSE_CODE: {
    SUCCESS: '00',
  },

  // Cache Keys (Redis)
  CACHE_KEYS: {
    CART: (userId) => `cart:${userId}`,
    SESSION: (sessionId) => `session:${sessionId}`,
    PRODUCT: (productId) => `product:${productId}`,
    CATEGORY: 'categories',
    COUPONS: 'coupons:active',
  },

  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_ERROR: 500,
  },

  // Error Messages
  ERRORS: {
    INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
    USER_NOT_FOUND: 'Không tìm thấy người dùng',
    PRODUCT_NOT_FOUND: 'Không tìm thấy sản phẩm',
    ORDER_NOT_FOUND: 'Không tìm thấy đơn hàng',
    CART_EMPTY: 'Giỏ hàng trống',
    INVALID_COUPON: 'Mã giảm giá không hợp lệ hoặc đã hết hạn',
    INSUFFICIENT_STOCK: 'Không đủ tồn kho',
    DELIVERY_DATE_INVALID: 'Ngày giao hàng phải cách hiện tại ít nhất 48 giờ',
    UNAUTHORIZED: 'Không có quyền truy cập',
    INTERNAL_ERROR: 'Lỗi hệ thống',
  },
};

module.exports = CONSTANTS;
