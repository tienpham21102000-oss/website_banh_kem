const ProductService = require('../services/ProductService');
const logger = require('../utils/logger');

/**
 * GET /api/products - List products
 */
async function getProducts(req, res, next) {
  try {
    const { category, search, sortBy, limit = 50, offset = 0 } = req.query;

    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({ error: 'limit phải là số nguyên dương' });
    }

    const filters = {
      category,
      search,
      sortBy,
      limit: parsedLimit,
      offset: parseInt(offset),
    };

    const products = await ProductService.getProducts(filters);

    res.json({
      products,
      count: products.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/products/:id - Get product details
 */
async function getProductById(req, res, next) {
  try {
    const { id } = req.params;

    const product = await ProductService.getProductById(id);

    if (!product) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/products/category/:categoryId - Get products by category
 */
async function getProductsByCategory(req, res, next) {
  try {
    const { categoryId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const products = await ProductService.getProducts({
      category: categoryId,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      products,
      count: products.length,
    });
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

module.exports = {
  getProducts,
  getProductById,
  getProductsByCategory,
  getCategories,
};
