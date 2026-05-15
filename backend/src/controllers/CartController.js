const CartService = require('../services/CartService');
const ProductService = require('../services/ProductService');
const logger = require('../utils/logger');

/**
 * GET /api/cart - Get user cart
 */
async function getCart(req, res, next) {
  try {
    const { userId } = req;

    const cart = await CartService.getCart(userId);

    res.json(cart);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/cart - Add item to cart
 */
async function addToCart(req, res, next) {
  try {
    const { userId } = req;
    const { variantId, quantity = 1, customNotes = '' } = req.body;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Số lượng phải là số nguyên dương' });
    }

    // Validate variant exists
    const variant = await ProductService.getVariant(variantId);
    if (!variant) {
      return res.status(404).json({ error: 'Không tìm thấy biến thể sản phẩm' });
    }

    // Check stock
    const stockCheck = await ProductService.checkStock(variantId, quantity);
    if (!stockCheck.available) {
      return res.status(400).json({ error: 'Không đủ tồn kho' });
    }

    const cart = await CartService.addToCart(userId, variantId, quantity, customNotes);

    res.status(201).json(cart);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/cart/:variantId - Remove item from cart
 */
async function removeFromCart(req, res, next) {
  try {
    const { userId } = req;
    const { variantId } = req.params;

    const cart = await CartService.removeFromCart(userId, variantId);

    res.json(cart);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/cart/:variantId - Update item quantity
 */
async function updateItemQuantity(req, res, next) {
  try {
    const { userId } = req;
    const { variantId } = req.params;
    const { quantity } = req.body;

    if (!Number.isInteger(quantity)) {
      return res.status(400).json({ error: 'Số lượng phải là số nguyên' });
    }

    const cart = await CartService.updateItemQuantity(userId, variantId, quantity);

    res.json(cart);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/cart - Clear cart
 */
async function clearCart(req, res, next) {
  try {
    const { userId } = req;

    const cart = await CartService.clearCart(userId);

    res.json(cart);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  updateItemQuantity,
  clearCart,
};
