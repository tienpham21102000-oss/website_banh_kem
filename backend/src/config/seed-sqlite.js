const pool = require('./database');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  try {
    logger.info('Seeding Rich Data for SQLite...');

    // Clear existing data (optional but good for clean seed)
    await pool.query('DELETE FROM order_items');
    await pool.query('DELETE FROM orders');
    await pool.query('DELETE FROM product_variants');
    await pool.query('DELETE FROM products');
    await pool.query('DELETE FROM categories');
    await pool.query('DELETE FROM users');

    // 1. Categories
    const categories = [
      ['cat-001', 'Bánh kem', 'banh-kem', 'Các mẫu bánh kem thiết kế và sinh nhật', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587'],
      ['cat-002', 'Bánh ăn chơi', 'banh-an-choi', 'Bánh ngọt ăn nhẹ và mini cupcake', 'https://images.unsplash.com/photo-1519869325930-281384150729']
    ];

    for (const cat of categories) {
      await pool.query('INSERT INTO categories (id, name, slug, description, image_url) VALUES ($1, $2, $3, $4, $5)', cat);
    }

    // 2. Products
    const products = [
      ['prod-001', 'BK-CHOC', 'Bánh Chocolate Ganache', 'Bánh chocolate đậm vị, ít ngọt', 'cat-001', 350000, 'https://images.unsplash.com/photo-1562777717-dc6984f65a63'],
      ['prod-002', 'BK-FRUIT', 'Bánh Trái Cây Tươi', 'Vani kem sữa và trái cây mùa hè', 'cat-001', 380000, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad'],
      ['prod-003', 'BK-VELVET', 'Red Velvet Classic', 'Cốt bánh đỏ nhung béo ngậy', 'cat-001', 420000, 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f'],
      ['prod-004', 'BK-PASTEL', 'Pastel Pink Dream', 'Bánh thiết kế tone hồng nhẹ nhàng', 'cat-001', 550000, 'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec'],
      ['prod-005', 'BC-MAC', 'Macaron Mix', 'Hộp 6 bánh macaron đa vị', 'cat-002', 150000, 'https://images.unsplash.com/photo-1569864358642-9d1684040f43']
    ];

    for (const prod of products) {
      await pool.query('INSERT INTO products (id, sku, name, description, category_id, base_price, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7)', prod);
    }

    // 3. Variants
    const variants = [
      // Chocolate variants
      [uuidv4(), 'prod-001', 'CHOC-18', '18cm', 'Oreo', 'Dark', 20, 0],
      [uuidv4(), 'prod-001', 'CHOC-22', '22cm', 'Strawberry', 'Dark', 15, 100000],
      // Fruit variants
      [uuidv4(), 'prod-002', 'FRUIT-16', '16cm', 'Fresh Kiwi', 'White', 12, 0],
      [uuidv4(), 'prod-002', 'FRUIT-20', '20cm', 'Mixed Fruits', 'White', 10, 80000],
      // Red Velvet
      [uuidv4(), 'prod-003', 'VELVET-18', '18cm', 'Cheese Cream', 'Red', 10, 0],
      // Pastel
      [uuidv4(), 'prod-004', 'PASTEL-20', '20cm', 'Macarons', 'Pink', 5, 0],
      // Macarons
      [uuidv4(), 'prod-005', 'MAC-MIX-6', 'Hộp 6 cái', 'Mix', 'Multi', 50, 0]
    ];

    for (const v of variants) {
      await pool.query('INSERT INTO product_variants (id, product_id, variant_sku, size, topping, color, stock_quantity, price_adjustment) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', v);
    }

    // 4. Admin User
    const passwordHash = await bcrypt.hash('admin123', 10);
    await pool.query(
      'INSERT INTO users (id, email, password_hash, display_name, phone) VALUES ($1, $2, $3, $4, $5)',
      ['user-admin-001', 'admin@banhkem.com', passwordHash, 'Admin Demo', '0901234567']
    );

    logger.info('Rich Seeding Completed!');
  } catch (error) {
    logger.error('Seeding Failed:', error);
  }
}

seed();
