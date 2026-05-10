const env = require('../config/env');
const CONSTANTS = require('../utils/constant');
const OrderService = require('../services/OrderService');
const ProductService = require('../services/ProductService');
const CouponService = require('../services/CouponService');
const logger = require('../utils/logger');

async function getOrders(req, res, next) {
  try {
    const { status, startDate, endDate, search, limit = 50, offset = 0 } = req.query;
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);

    if (Number.isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({ error: 'limit phải là số nguyên dương' });
    }

    if (Number.isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({ error: 'offset phải là số nguyên không âm' });
    }

    const orders = await OrderService.getOrdersForAdmin({
      status,
      startDate,
      endDate,
      search,
      limit: parsedLimit,
      offset: parsedOffset,
    });

    logger.info(`Admin Order Fetch: Found ${orders.length} orders`);
    res.json({ orders, count: orders.length });
  } catch (error) {
    next(error);
  }
}

async function getOrderById(req, res, next) {
  try {
    const { orderId } = req.params;
    const order = await OrderService.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Cần status' });
    }

    const allowedStatuses = Object.values(CONSTANTS.ORDER_STATUS);
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Trạng thái đơn hàng không hợp lệ' });
    }

    const order = await OrderService.updateOrderStatus(orderId, status);
    res.json(order);
  } catch (error) {
    next(error);
  }
}

async function getCategories(req, res, next) {
  try {
    const categories = await ProductService.getCategories();
    res.json({ categories, count: categories.length });
  } catch (error) {
    next(error);
  }
}

async function getProducts(req, res, next) {
  try {
    const { category, search, status, sortBy, limit = 50, offset = 0 } = req.query;
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);

    if (Number.isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({ error: 'limit phải là số nguyên dương' });
    }

    if (Number.isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({ error: 'offset phải là số nguyên không âm' });
    }

    const products = await ProductService.getProductsForAdmin({
      category,
      search,
      status,
      sortBy,
      limit: parsedLimit,
      offset: parsedOffset,
    });

    res.json({ products, count: products.length });
  } catch (error) {
    next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const {
      sku,
      name,
      description = '',
      categoryId,
      basePrice,
      minAdvanceHours = env.MIN_DELIVERY_ADVANCE_HOURS,
      imageUrl = '',
    } = req.body;

    if (!sku || !name || !categoryId || basePrice === undefined || basePrice === null) {
      return res.status(400).json({ error: 'Cần sku, tên, categoryId và giá cơ bản' });
    }

    const normalizedBasePrice = Number(basePrice);
    const normalizedAdvanceHours = Number(minAdvanceHours);

    if (!Number.isFinite(normalizedBasePrice) || normalizedBasePrice < 0) {
      return res.status(400).json({ error: 'Giá cơ bản phải là số không âm' });
    }

    if (!Number.isInteger(normalizedAdvanceHours) || normalizedAdvanceHours < 0) {
      return res.status(400).json({ error: 'Số giờ đặt trước phải là số nguyên không âm' });
    }

    const product = await ProductService.createProduct({
      sku,
      name,
      description,
      categoryId,
      basePrice: normalizedBasePrice,
      minAdvanceHours: normalizedAdvanceHours,
      imageUrl,
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { productId } = req.params;
    const {
      sku,
      name,
      description,
      categoryId,
      basePrice,
      minAdvanceHours,
      imageUrl,
      status,
    } = req.body;

    const updateData = {};

    if (sku !== undefined) updateData.sku = sku;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (categoryId !== undefined) updateData.category_id = categoryId;
    if (imageUrl !== undefined) updateData.image_url = imageUrl;

    if (basePrice !== undefined) {
      const normalizedBasePrice = Number(basePrice);
      if (!Number.isFinite(normalizedBasePrice) || normalizedBasePrice < 0) {
        return res.status(400).json({ error: 'Giá cơ bản phải là số không âm' });
      }
      updateData.base_price = normalizedBasePrice;
    }

    if (minAdvanceHours !== undefined) {
      const normalizedAdvanceHours = Number(minAdvanceHours);
      if (!Number.isInteger(normalizedAdvanceHours) || normalizedAdvanceHours < 0) {
        return res.status(400).json({ error: 'Số giờ đặt trước phải là số nguyên không âm' });
      }
      updateData.min_advance_hours = normalizedAdvanceHours;
    }

    if (status !== undefined) {
      if (!Object.values(CONSTANTS.PRODUCT_STATUS).includes(status)) {
        return res.status(400).json({ error: 'Trạng thái sản phẩm không hợp lệ' });
      }
      updateData.status = status;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Không có trường dữ liệu hợp lệ để cập nhật' });
    }

    const product = await ProductService.updateProduct(productId, updateData);

    if (!product) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
}

async function createVariant(req, res, next) {
  try {
    const { productId } = req.params;
    const {
      variantSku,
      size = '',
      topping = '',
      color = '',
      stockQuantity = 0,
      priceAdjustment = 0,
    } = req.body;

    if (!variantSku) {
      return res.status(400).json({ error: 'Cần variantSku' });
    }

    const normalizedStockQuantity = Number(stockQuantity);
    const normalizedPriceAdjustment = Number(priceAdjustment);

    if (!Number.isInteger(normalizedStockQuantity) || normalizedStockQuantity < 0) {
      return res.status(400).json({ error: 'Tồn kho phải là số nguyên không âm' });
    }

    if (!Number.isFinite(normalizedPriceAdjustment)) {
      return res.status(400).json({ error: 'Giá điều chỉnh phải là một số hợp lệ' });
    }

    const existingProduct = await ProductService.getProductById(productId);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }

    const variant = await ProductService.createVariant(productId, {
      variantSku,
      size,
      topping,
      color,
      stockQuantity: normalizedStockQuantity,
      priceAdjustment: normalizedPriceAdjustment,
    });

    res.status(201).json(variant);
  } catch (error) {
    next(error);
  }
}

async function updateVariant(req, res, next) {
  try {
    const { variantId } = req.params;
    const {
      variantSku,
      size,
      topping,
      color,
      stockQuantity,
      priceAdjustment,
    } = req.body;

    const updateData = {};

    if (variantSku !== undefined) updateData.variant_sku = variantSku;
    if (size !== undefined) updateData.size = size;
    if (topping !== undefined) updateData.topping = topping;
    if (color !== undefined) updateData.color = color;

    if (stockQuantity !== undefined) {
      const normalizedStockQuantity = Number(stockQuantity);
      if (!Number.isInteger(normalizedStockQuantity) || normalizedStockQuantity < 0) {
        return res.status(400).json({ error: 'Tồn kho phải là số nguyên không âm' });
      }
      updateData.stock_quantity = normalizedStockQuantity;
    }

    if (priceAdjustment !== undefined) {
      const normalizedPriceAdjustment = Number(priceAdjustment);
      if (!Number.isFinite(normalizedPriceAdjustment)) {
        return res.status(400).json({ error: 'Giá điều chỉnh phải là một số hợp lệ' });
      }
      updateData.price_adjustment = normalizedPriceAdjustment;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Không có trường dữ liệu hợp lệ để cập nhật' });
    }

    const variant = await ProductService.updateVariant(variantId, updateData);

    if (!variant) {
      return res.status(404).json({ error: 'Không tìm thấy biến thể' });
    }

    res.json(variant);
  } catch (error) {
    next(error);
  }
}

async function deleteVariant(req, res, next) {
  try {
    const { variantId } = req.params;
    const deletedVariant = await ProductService.deleteVariant(variantId);

    if (!deletedVariant) {
      return res.status(404).json({ error: 'Không tìm thấy biến thể' });
    }

    res.json({ deleted: true, variantId: deletedVariant.id });
  } catch (error) {
    next(error);
  }
}

async function getCoupons(req, res, next) {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);

    if (Number.isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({ error: 'limit phải là số nguyên dương' });
    }

    if (Number.isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({ error: 'offset phải là số nguyên không âm' });
    }

    const coupons = await CouponService.getCouponsForAdmin(parsedLimit, parsedOffset);
    res.json({ coupons, count: coupons.length });
  } catch (error) {
    next(error);
  }
}

async function createCoupon(req, res, next) {
  try {
    const {
      code,
      discountType,
      discountValue,
      maxUses = null,
      minOrderAmount = 0,
      validFrom,
      validUntil,
    } = req.body;

    if (!code || !discountType || discountValue === undefined || !validFrom || !validUntil) {
      return res.status(400).json({ error: 'Cần code, discountType, discountValue, validFrom và validUntil' });
    }

    if (!Object.values(CONSTANTS.DISCOUNT_TYPE).includes(discountType)) {
      return res.status(400).json({ error: 'Loại giảm giá không hợp lệ' });
    }

    const normalizedDiscountValue = Number(discountValue);
    const normalizedMinOrderAmount = Number(minOrderAmount);
    const normalizedMaxUses = maxUses === null ? null : Number(maxUses);

    if (!Number.isFinite(normalizedDiscountValue) || normalizedDiscountValue <= 0) {
      return res.status(400).json({ error: 'Giá trị giảm giá phải là số dương' });
    }

    if (!Number.isFinite(normalizedMinOrderAmount) || normalizedMinOrderAmount < 0) {
      return res.status(400).json({ error: 'Đơn tối thiểu phải là số không âm' });
    }

    if (normalizedMaxUses !== null && (!Number.isInteger(normalizedMaxUses) || normalizedMaxUses <= 0)) {
      return res.status(400).json({ error: 'Số lượt dùng tối đa phải là số nguyên dương (nếu có)' });
    }

    const coupon = await CouponService.createCoupon({
      code,
      discountType,
      discountValue: normalizedDiscountValue,
      maxUses: normalizedMaxUses,
      minOrderAmount: normalizedMinOrderAmount,
      validFrom,
      validUntil,
    });

    res.status(201).json(coupon);
  } catch (error) {
    next(error);
  }
}

async function updateCoupon(req, res, next) {
  try {
    const { couponId } = req.params;
    const {
      discountType,
      discountValue,
      maxUses,
      minOrderAmount,
      validFrom,
      validUntil,
      status,
    } = req.body;

    const updateData = {};

    if (discountType !== undefined) {
      if (!Object.values(CONSTANTS.DISCOUNT_TYPE).includes(discountType)) {
        return res.status(400).json({ error: 'Loại giảm giá không hợp lệ' });
      }
      updateData.discount_type = discountType;
    }

    if (discountValue !== undefined) {
      const normalizedDiscountValue = Number(discountValue);
      if (!Number.isFinite(normalizedDiscountValue) || normalizedDiscountValue <= 0) {
        return res.status(400).json({ error: 'Giá trị giảm giá phải là số dương' });
      }
      updateData.discount_value = normalizedDiscountValue;
    }

    if (maxUses !== undefined) {
      if (maxUses === null || maxUses === '') {
        updateData.max_uses = null;
      } else {
        const normalizedMaxUses = Number(maxUses);
        if (!Number.isInteger(normalizedMaxUses) || normalizedMaxUses <= 0) {
          return res.status(400).json({ error: 'Số lượt dùng tối đa phải là số nguyên dương (nếu có)' });
        }
        updateData.max_uses = normalizedMaxUses;
      }
    }

    if (minOrderAmount !== undefined) {
      const normalizedMinOrderAmount = Number(minOrderAmount);
      if (!Number.isFinite(normalizedMinOrderAmount) || normalizedMinOrderAmount < 0) {
        return res.status(400).json({ error: 'Đơn tối thiểu phải là số không âm' });
      }
      updateData.min_order_amount = normalizedMinOrderAmount;
    }

    if (validFrom !== undefined) updateData.valid_from = validFrom;
    if (validUntil !== undefined) updateData.valid_until = validUntil;

    if (status !== undefined) {
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ error: 'Trạng thái coupon không hợp lệ' });
      }
      updateData.status = status;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Không có trường dữ liệu hợp lệ để cập nhật' });
    }

    const coupon = await CouponService.updateCoupon(couponId, updateData);

    if (!coupon) {
      return res.status(404).json({ error: 'Không tìm thấy coupon' });
    }

    res.json(coupon);
  } catch (error) {
    next(error);
  }
}

async function deleteCoupon(req, res, next) {
  try {
    const { couponId } = req.params;
    const deletedCoupon = await CouponService.deleteCoupon(couponId);

    if (!deletedCoupon) {
      return res.status(404).json({ error: 'Không tìm thấy coupon' });
    }

    res.json({ deleted: true, couponId: deletedCoupon.id });
  } catch (error) {
    next(error);
  }
}

async function getStats(req, res, next) {
  try {
    const stats = await OrderService.getAdminStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProducts,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getCategories,
  createProduct,
  updateProduct,
  createVariant,
  updateVariant,
  deleteVariant,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getStats,
};
