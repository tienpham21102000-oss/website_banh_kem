const pool = require('./database');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

async function init() {
  try {
    logger.info('Initializing SQLite Schema...');

    // 1. Categories
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        image_url TEXT,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Products
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        sku TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        category_id TEXT REFERENCES categories(id),
        base_price DECIMAL(12, 2) NOT NULL,
        min_advance_hours INTEGER DEFAULT 48,
        image_url TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Product Variants
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id TEXT PRIMARY KEY,
        product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
        variant_sku TEXT UNIQUE NOT NULL,
        size TEXT,
        topping TEXT,
        color TEXT,
        stock_quantity INTEGER DEFAULT 0,
        price_adjustment DECIMAL(12, 2) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        phone TEXT,
        verified_email BOOLEAN DEFAULT 0,
        verified_phone BOOLEAN DEFAULT 0,
        loyalty_points INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Orders
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        order_number TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_method TEXT NOT NULL,
        payment_status TEXT DEFAULT 'pending',
        total_amount DECIMAL(12, 2) NOT NULL,
        shipping_fee DECIMAL(12, 2) DEFAULT 0,
        discount_amount DECIMAL(12, 2) DEFAULT 0,
        shipping_address TEXT, -- JSON string in SQLite
        custom_notes TEXT,
        requested_delivery_date TEXT,
        requested_delivery_time TEXT,
        coupon_code TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. Order Items
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
        product_id TEXT,
        product_name TEXT NOT NULL,
        variant_id TEXT,
        variant_sku TEXT,
        size TEXT,
        topping TEXT,
        color TEXT,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(12, 2) NOT NULL,
        subtotal DECIMAL(12, 2) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed Admin User
    const adminEmail = 'admin@banhkem.com';
    const adminCheck = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    
    if (adminCheck.rows.length === 0) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO users (id, email, password_hash, display_name, phone) VALUES ($1, $2, $3, $4, $5)',
        ['user-admin-001', adminEmail, passwordHash, 'Admin Demo', '0901234567']
      );
      logger.info('Seed: Admin user created');
    }

    // Seed Sample Category
    const catCheck = await pool.query('SELECT id FROM categories');
    if (catCheck.rows.length === 0) {
      await pool.query(
        'INSERT INTO categories (id, name, slug, description, image_url) VALUES ($1, $2, $3, $4, $5)',
        ['cat-001', 'Bánh Sinh Nhật', 'banh-sinh-nhat', 'Các mẫu bánh bán chạy', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587']
      );
      
      await pool.query(
        'INSERT INTO products (id, sku, name, description, category_id, base_price, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        ['prod-001', 'BK-CHOC', 'Bánh Chocolate Ganache', 'Bánh ngon it ngọt', 'cat-001', 350000, 'https://images.unsplash.com/photo-1562777717-dc6984f65a63']
      );

      await pool.query(
        'INSERT INTO product_variants (id, product_id, variant_sku, size, topping, stock_quantity) VALUES ($1, $2, $3, $4, $5, $6)',
        ['v-001', 'prod-001', 'CHOC-18', '18cm', 'Oreo', 20]
      );
      logger.info('Seed: Sample product and category created');
    }

    logger.info('SQLite Initialization Completed!');
  } catch (error) {
    logger.error('SQLite Initialization Failed:', error);
  }
}

init();
