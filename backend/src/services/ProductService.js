const pool = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class ProductService {
  /**
   * Get all products with filters
   */
  async getProducts(filters = {}) {
    try {
      const { category, search, sortBy = 'name', limit = 50, offset = 0 } = filters;

      let query = 'SELECT * FROM products WHERE status = $1';
      const params = ['active'];
      let paramCount = 2;

      if (category) {
        query += ` AND category_id = $${paramCount}`;
        params.push(category);
        paramCount++;
      }

      if (search) {
        query += ` AND (name LIKE $${paramCount} OR description LIKE $${paramCount})`;
        params.push(`%${search}%`);
        paramCount++;
      }

      // Sorting
      const allowedSorts = ['name', 'base_price', 'created_at'];
      const sortField = allowedSorts.includes(sortBy) ? sortBy : 'name';
      query += ` ORDER BY ${sortField} ASC`;

      query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('ProductService.getProducts error:', error);
      throw error;
    }
  }

  /**
   * Get product by ID with variants
   */
  async getProductById(productId) {
    try {
      const productQuery = 'SELECT * FROM products WHERE id = $1';
      const productResult = await pool.query(productQuery, [productId]);

      if (productResult.rows.length === 0) {
        return null;
      }

      const product = productResult.rows[0];

      // Get variants
      const variantsQuery = 'SELECT * FROM product_variants WHERE product_id = $1';
      const variantsResult = await pool.query(variantsQuery, [productId]);

      return {
        ...product,
        variants: variantsResult.rows,
      };
    } catch (error) {
      logger.error('ProductService.getProductById error:', error);
      throw error;
    }
  }

  /**
   * Get product variants by variant ID
   */
  async getVariant(variantId) {
    try {
      const query = `
        SELECT pv.*, p.name as product_name, p.base_price
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        WHERE pv.id = $1
      `;
      const result = await pool.query(query, [variantId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('ProductService.getVariant error:', error);
      throw error;
    }
  }

  /**
   * Check product stock
   */
  async checkStock(variantId, quantity) {
    try {
      const query = 'SELECT stock_quantity FROM product_variants WHERE id = $1';
      const result = await pool.query(query, [variantId]);

      if (result.rows.length === 0) {
        return { available: false, stock: 0 };
      }

      const stock = result.rows[0].stock_quantity;
      return {
        available: stock >= quantity,
        stock,
      };
    } catch (error) {
      logger.error('ProductService.checkStock error:', error);
      throw error;
    }
  }

  /**
   * Reserve stock (decrement on successful payment)
   */
  async reserveStock(variantId, quantity) {
    try {
      const query = `
        UPDATE product_variants
        SET stock_quantity = stock_quantity - $1
        WHERE id = $2 AND stock_quantity >= $1
        RETURNING stock_quantity
      `;
      await pool.query(query, [quantity, variantId]);
      const result = await pool.query('SELECT stock_quantity FROM product_variants WHERE id = $1', [variantId]);

      if (result.rows.length === 0) {
        throw new Error('Không đủ tồn kho');
      }

      logger.info(`Stock reserved: variant ${variantId}, qty ${quantity}`);
      return result.rows[0].stock_quantity;
    } catch (error) {
      logger.error('ProductService.reserveStock error:', error);
      throw error;
    }
  }

  /**
   * Get product minimum delivery hours
   */
  async getMinDeliveryHours(productId) {
    try {
      const query = `
        SELECT min_advance_hours 
        FROM products 
        WHERE id = $1
      `;
      const result = await pool.query(query, [productId]);
      return result.rows[0]?.min_advance_hours || 48;
    } catch (error) {
      logger.error('ProductService.getMinDeliveryHours error:', error);
      throw error;
    }
  }

  /**
   * Get category list
   */
  async getCategories() {
    try {
      const query = 'SELECT * FROM categories WHERE is_active = true ORDER BY display_order ASC';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('ProductService.getCategories error:', error);
      throw error;
    }
  }

  /**
   * Create product (admin only)
   */
  async createProduct(productData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        sku, name, description, categoryId, basePrice, minAdvanceHours = 48, imageUrl
      } = productData;

      const productId = uuidv4();
      const query = `
        INSERT INTO products (id, sku, name, description, category_id, base_price, min_advance_hours, image_url, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
        RETURNING *
      `;

      await client.query(query, [
        productId, sku, name, description, categoryId, basePrice, minAdvanceHours, imageUrl
      ]);

      const result = await client.query('SELECT * FROM products WHERE id = $1', [productId]);

      await client.query('COMMIT');
      logger.info(`Product created: ${productId}`);
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('ProductService.createProduct error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update product
   */
  async updateProduct(productId, updateData) {
    try {
      let query = 'UPDATE products SET ';
      const values = [];
      let paramCount = 1;

      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          query += `${key} = $${paramCount}, `;
          values.push(value);
          paramCount++;
        }
      });

      query += `updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
      values.push(productId);

      await pool.query(query, values);
      const result = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('ProductService.updateProduct error:', error);
      throw error;
    }
  }

  /**
   * Get products for admin view (includes all statuses)
   */
  async getProductsForAdmin(filters = {}) {
    try {
      const { category, search, status, sortBy = 'name', limit = 50, offset = 0 } = filters;

      let query = 'SELECT * FROM products WHERE 1=1';
      const params = [];
      let paramCount = 1;

      if (category) {
        query += ` AND category_id = $${paramCount}`;
        params.push(category);
        paramCount++;
      }

      if (status) {
        query += ` AND status = $${paramCount}`;
        params.push(status);
        paramCount++;
      }

      if (search) {
        query += ` AND (name LIKE $${paramCount} OR description LIKE $${paramCount} OR sku LIKE $${paramCount})`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        paramCount += 3;
      }

      const allowedSorts = ['name', 'base_price', 'created_at', 'status'];
      const sortField = allowedSorts.includes(sortBy) ? sortBy : 'name';
      query += ` ORDER BY ${sortField} ASC`;

      query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      const products = result.rows;

      // Attach variants to each product
      for (const product of products) {
        const variantsQuery = 'SELECT * FROM product_variants WHERE product_id = $1';
        const variantsResult = await pool.query(variantsQuery, [product.id]);
        product.variants = variantsResult.rows;
      }

      return products;
    } catch (error) {
      logger.error('ProductService.getProductsForAdmin error:', error);
      throw error;
    }
  }

  /**
   * Create product variant
   */
  async createVariant(productId, variantData) {
    try {
      const {
        variantSku, size, topping, color, stockQuantity, priceAdjustment
      } = variantData;

      const variantId = uuidv4();
      const query = `
        INSERT INTO product_variants (id, product_id, variant_sku, size, topping, color, stock_quantity, price_adjustment)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      await pool.query(query, [
        variantId, productId, variantSku, size, topping, color, stockQuantity, priceAdjustment
      ]);

      const result = await pool.query('SELECT * FROM product_variants WHERE id = $1', [variantId]);

      logger.info(`Variant created: ${variantSku}`);
      return result.rows[0];
    } catch (error) {
      logger.error('ProductService.createVariant error:', error);
      throw error;
    }
  }

  /**
   * Update product variant
   */
  async updateVariant(variantId, updateData) {
    try {
      let query = 'UPDATE product_variants SET ';
      const values = [];
      let paramCount = 1;

      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          query += `${key} = $${paramCount}, `;
          values.push(value);
          paramCount++;
        }
      });

      query += `updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
      values.push(variantId);

      await pool.query(query, values);
      const result = await pool.query('SELECT * FROM product_variants WHERE id = $1', [variantId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('ProductService.updateVariant error:', error);
      throw error;
    }
  }

  /**
   * Delete product variant
   */
  async deleteVariant(variantId) {
    try {
      const existing = await pool.query('SELECT * FROM product_variants WHERE id = $1', [variantId]);
      const query = 'DELETE FROM product_variants WHERE id = $1';
      await pool.query(query, [variantId]);
      const result = existing;
      logger.info(`Variant deleted: ${variantId}`);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('ProductService.deleteVariant error:', error);
      throw error;
    }
  }
}

module.exports = new ProductService();
