-- Migration: 001-init-schema.sql
-- Description: Initialize main database schema for bánh kem ordering system
-- Created: 2026-05-02

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255),
  display_name VARCHAR(255),
  verified_email BOOLEAN DEFAULT false,
  verified_phone BOOLEAN DEFAULT false,
  loyalty_points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User addresses
CREATE TABLE user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_line VARCHAR(255) NOT NULL,
  district VARCHAR(100),
  province VARCHAR(100),
  postal_code VARCHAR(20),
  phone VARCHAR(20),
  recipient_name VARCHAR(255),
  is_default BOOLEAN DEFAULT false,
  address_type VARCHAR(50), -- 'home', 'office'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  parent_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  base_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'discontinued'
  min_advance_hours INT DEFAULT 48,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product variants (sizes, toppings, etc.)
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_sku VARCHAR(100) NOT NULL,
  size VARCHAR(100),
  topping VARCHAR(100),
  color VARCHAR(100),
  stock_quantity INT DEFAULT 0,
  price_adjustment DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (product_id, variant_sku)
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, paid, processing, shipped, delivered, cancelled, refunded
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_fee DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  payment_method VARCHAR(50), -- 'vnpay', 'momo', 'cod', 'bank_transfer'
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  shipping_address JSONB,
  custom_notes TEXT,
  requested_delivery_date VARCHAR(20),
  requested_delivery_time VARCHAR(50), -- 'morning', 'afternoon', 'evening'
  coupon_code VARCHAR(50),
  tracking_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP,
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  gateway VARCHAR(50) NOT NULL, -- 'vnpay', 'momo', 'stripe'
  gateway_transaction_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'VND',
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'success', 'failed', 'refunded'
  response_code VARCHAR(50),
  response_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  received_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (gateway, gateway_transaction_id)
);

-- Coupons
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(100) UNIQUE NOT NULL,
  discount_type VARCHAR(50) NOT NULL, -- 'percentage', 'fixed'
  discount_value DECIMAL(10, 2) NOT NULL,
  max_uses INT,
  usage_count INT DEFAULT 0,
  min_order_amount DECIMAL(10, 2),
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Coupon usage audit trail
CREATE TABLE coupon_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  applied_discount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delivery window configuration
CREATE TABLE delivery_window_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  min_advance_hours INT DEFAULT 48,
  available_time_slots TEXT, -- JSON array: ["morning", "afternoon", "evening"]
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (product_id)
);

-- Blackout dates (holidays, shop closed)
CREATE TABLE blackout_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date_start TIMESTAMP NOT NULL,
  date_end TIMESTAMP NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_requested_delivery ON orders(requested_delivery_date);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_gateway_tx ON payments(gateway, gateway_transaction_id);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_status ON coupons(status);
CREATE INDEX idx_coupon_usages_coupon ON coupon_usages(coupon_id);
CREATE INDEX idx_coupon_usages_order ON coupon_usages(order_id);
CREATE INDEX idx_blackout_dates ON blackout_dates(date_start, date_end);

-- Auto-update timestamp triggers
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_products_timestamp BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_orders_timestamp BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_payments_timestamp BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_coupons_timestamp BEFORE UPDATE ON coupons
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
