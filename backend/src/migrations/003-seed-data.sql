-- Migration: 003-seed-data.sql
-- Description: Seed initial categories, products, variants, delivery configs, coupons, and admin user
-- Safe to re-run: all inserts use ON CONFLICT DO NOTHING

-- Admin user (password: admin123)
INSERT INTO users (id, email, phone, password_hash, display_name, verified_email, verified_phone)
VALUES (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'admin@banhkem.com',
  NULL,
  '$2a$10$1UFHb8p77tKYvGYQFIKn7e1oUcUC867qvCDh2YxH/.LO9NJuc/C8W',
  'Quản trị viên',
  true,
  false
) ON CONFLICT (email) DO NOTHING;

-- Categories
INSERT INTO categories (id, name, slug, description, image_url, display_order, is_active)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Bánh Sinh Nhật',
    'banh-sinh-nhat',
    'Các mẫu bánh sinh nhật bán chạy cho tiệc gia đình và công ty.',
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587',
    1,
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Bánh Thiết Kế',
    'banh-thiet-ke',
    'Bánh kem thiết kế theo chủ đề, màu sắc và thông điệp riêng.',
    'https://images.unsplash.com/photo-1464306076886-da185f6a9d05',
    2,
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- Products
INSERT INTO products (id, sku, name, description, category_id, base_price, status, min_advance_hours, image_url)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'BK-BDAY-CHOC-001',
    'Bánh Chocolate Sinh Nhật',
    'Cốt bánh chocolate mềm, kem tươi ít ngọt, phủ chocolate ganache.',
    '11111111-1111-1111-1111-111111111111',
    320000,
    'active',
    48,
    'https://images.unsplash.com/photo-1562777717-dc6984f65a63'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'BK-FRESH-FRUIT-002',
    'Bánh Trái Cây Tươi',
    'Bánh vani kem sữa tươi, phủ dâu tây, kiwi và nho xanh.',
    '11111111-1111-1111-1111-111111111111',
    360000,
    'active',
    48,
    'https://images.unsplash.com/photo-1533134242443-d4fd215305ad'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    'BK-CUSTOM-PASTEL-003',
    'Bánh Pastel Thiết Kế',
    'Màu pastel nhẹ, phù hợp tiệc sinh nhật, baby shower và party nhỏ.',
    '22222222-2222-2222-2222-222222222222',
    480000,
    'active',
    72,
    'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec'
  )
ON CONFLICT (sku) DO NOTHING;

-- Product variants
INSERT INTO product_variants (id, product_id, variant_sku, size, topping, color, stock_quantity, price_adjustment)
VALUES
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '18CM-OREO-WHITE',
    '18cm', 'Oreo', 'White', 12, 0
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb002',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '22CM-BERRY-BROWN',
    '22cm', 'Berry', 'Brown', 8, 90000
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb003',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    '16CM-FRUIT-WHITE',
    '16cm', 'Fresh Fruit', 'White', 10, 0
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb004',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    '20CM-FRUIT-PINK',
    '20cm', 'Fresh Fruit', 'Pink', 7, 70000
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb005',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    '20CM-MACARON-BLUE',
    '20cm', 'Macaron', 'Blue', 6, 110000
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb006',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    '24CM-FLOWER-LILAC',
    '24cm', 'Butter Flower', 'Lilac', 4, 180000
  )
ON CONFLICT (product_id, variant_sku) DO NOTHING;

-- Delivery window configs
INSERT INTO delivery_window_config (id, product_id, min_advance_hours, available_time_slots)
VALUES
  (
    'cccccccc-cccc-cccc-cccc-aaaaaaaaaaa1',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    48,
    '["morning","afternoon","evening"]'
  ),
  (
    'cccccccc-cccc-cccc-cccc-aaaaaaaaaaa2',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    48,
    '["morning","afternoon","evening"]'
  ),
  (
    'cccccccc-cccc-cccc-cccc-aaaaaaaaaaa3',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    72,
    '["morning","afternoon","evening"]'
  )
ON CONFLICT (product_id) DO NOTHING;

-- Coupons
INSERT INTO coupons (id, code, discount_type, discount_value, max_uses, usage_count, min_order_amount, valid_from, valid_until, status)
VALUES
  (
    'dddddddd-dddd-dddd-dddd-dddddddd0001',
    'WELCOME10',
    'percentage',
    10,
    500,
    0,
    250000,
    '2026-01-01T00:00:00Z',
    '2026-12-31T23:59:59Z',
    'active'
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddd0002',
    'FREESHIP50',
    'fixed',
    50000,
    200,
    0,
    500000,
    '2026-01-01T00:00:00Z',
    '2026-12-31T23:59:59Z',
    'active'
  )
ON CONFLICT (code) DO NOTHING;
