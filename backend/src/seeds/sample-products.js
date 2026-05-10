require('../config/env');

const pool = require('../config/database');

const categories = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Banh Sinh Nhat',
    slug: 'banh-sinh-nhat',
    description: 'Cac mau banh sinh nhat ban chay cho tiec gia dinh va cong ty.',
    image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587',
    display_order: 1,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Banh Thiet Ke',
    slug: 'banh-thiet-ke',
    description: 'Banh kem thiet ke theo chu de, mau sac va thong diep rieng.',
    image_url: 'https://images.unsplash.com/photo-1464306076886-da185f6a9d05',
    display_order: 2,
  },
];

const products = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    sku: 'BK-BDAY-CHOC-001',
    name: 'Banh Chocolate Sinh Nhat',
    description: 'Cot banh chocolate mem, kem tuoi it ngot, phu chocolate ganache.',
    category_id: categories[0].id,
    base_price: 320000,
    min_advance_hours: 48,
    image_url: 'https://images.unsplash.com/photo-1562777717-dc6984f65a63',
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    sku: 'BK-FRESH-FRUIT-002',
    name: 'Banh Trai Cay Tuoi',
    description: 'Banh vani kem sua tuoi, phu dau tay, kiwi va nho xanh.',
    category_id: categories[0].id,
    base_price: 360000,
    min_advance_hours: 48,
    image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad',
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    sku: 'BK-CUSTOM-PASTEL-003',
    name: 'Banh Pastel Thiet Ke',
    description: 'Mau pastel nhe, phu hop tiec sinh nhat, baby shower va party nho.',
    category_id: categories[1].id,
    base_price: 480000,
    min_advance_hours: 72,
    image_url: 'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec',
  },
];

const variants = [
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb001',
    product_id: products[0].id,
    variant_sku: '18CM-OREO-WHITE',
    size: '18cm',
    topping: 'Oreo',
    color: 'White',
    stock_quantity: 12,
    price_adjustment: 0,
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb002',
    product_id: products[0].id,
    variant_sku: '22CM-BERRY-BROWN',
    size: '22cm',
    topping: 'Berry',
    color: 'Brown',
    stock_quantity: 8,
    price_adjustment: 90000,
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb003',
    product_id: products[1].id,
    variant_sku: '16CM-FRUIT-WHITE',
    size: '16cm',
    topping: 'Fresh Fruit',
    color: 'White',
    stock_quantity: 10,
    price_adjustment: 0,
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb004',
    product_id: products[1].id,
    variant_sku: '20CM-FRUIT-PINK',
    size: '20cm',
    topping: 'Fresh Fruit',
    color: 'Pink',
    stock_quantity: 7,
    price_adjustment: 70000,
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb005',
    product_id: products[2].id,
    variant_sku: '20CM-MACARON-BLUE',
    size: '20cm',
    topping: 'Macaron',
    color: 'Blue',
    stock_quantity: 6,
    price_adjustment: 110000,
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb006',
    product_id: products[2].id,
    variant_sku: '24CM-FLOWER-LILAC',
    size: '24cm',
    topping: 'Butter Flower',
    color: 'Lilac',
    stock_quantity: 4,
    price_adjustment: 180000,
  },
];

const deliveryConfigs = products.map((product) => ({
  id: `cccccccc-cccc-cccc-cccc-${product.id.slice(-12)}`,
  product_id: product.id,
  min_advance_hours: product.min_advance_hours,
  available_time_slots: JSON.stringify(['morning', 'afternoon', 'evening']),
}));

const coupons = [
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddd0001',
    code: 'WELCOME10',
    discount_type: 'percentage',
    discount_value: 10,
    max_uses: 500,
    min_order_amount: 250000,
    valid_from: '2026-01-01T00:00:00Z',
    valid_until: '2026-12-31T23:59:59Z',
  },
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddd0002',
    code: 'FREESHIP50',
    discount_type: 'fixed',
    discount_value: 50000,
    max_uses: 200,
    min_order_amount: 500000,
    valid_from: '2026-01-01T00:00:00Z',
    valid_until: '2026-12-31T23:59:59Z',
  },
];

async function seedCategories(client) {
  for (const category of categories) {
    await client.query(
      `
        INSERT INTO categories (id, name, slug, description, image_url, display_order, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        ON CONFLICT (slug) DO UPDATE
        SET name = EXCLUDED.name,
            description = EXCLUDED.description,
            image_url = EXCLUDED.image_url,
            display_order = EXCLUDED.display_order,
            is_active = true,
            updated_at = CURRENT_TIMESTAMP
      `,
      [
        category.id,
        category.name,
        category.slug,
        category.description,
        category.image_url,
        category.display_order,
      ]
    );
  }
}

async function seedProducts(client) {
  for (const product of products) {
    await client.query(
      `
        INSERT INTO products (
          id, sku, name, description, category_id, base_price, status, min_advance_hours, image_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8)
        ON CONFLICT (sku) DO UPDATE
        SET name = EXCLUDED.name,
            description = EXCLUDED.description,
            category_id = EXCLUDED.category_id,
            base_price = EXCLUDED.base_price,
            status = 'active',
            min_advance_hours = EXCLUDED.min_advance_hours,
            image_url = EXCLUDED.image_url,
            updated_at = CURRENT_TIMESTAMP
      `,
      [
        product.id,
        product.sku,
        product.name,
        product.description,
        product.category_id,
        product.base_price,
        product.min_advance_hours,
        product.image_url,
      ]
    );
  }
}

async function seedVariants(client) {
  for (const variant of variants) {
    await client.query(
      `
        INSERT INTO product_variants (
          id, product_id, variant_sku, size, topping, color, stock_quantity, price_adjustment
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (product_id, variant_sku) DO UPDATE
        SET size = EXCLUDED.size,
            topping = EXCLUDED.topping,
            color = EXCLUDED.color,
            stock_quantity = EXCLUDED.stock_quantity,
            price_adjustment = EXCLUDED.price_adjustment,
            updated_at = CURRENT_TIMESTAMP
      `,
      [
        variant.id,
        variant.product_id,
        variant.variant_sku,
        variant.size,
        variant.topping,
        variant.color,
        variant.stock_quantity,
        variant.price_adjustment,
      ]
    );
  }
}

async function seedDeliveryConfigs(client) {
  for (const config of deliveryConfigs) {
    await client.query(
      `
        INSERT INTO delivery_window_config (
          id, product_id, min_advance_hours, available_time_slots
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (product_id) DO UPDATE
        SET min_advance_hours = EXCLUDED.min_advance_hours,
            available_time_slots = EXCLUDED.available_time_slots,
            updated_at = CURRENT_TIMESTAMP
      `,
      [
        config.id,
        config.product_id,
        config.min_advance_hours,
        config.available_time_slots,
      ]
    );
  }
}

async function seedCoupons(client) {
  for (const coupon of coupons) {
    await client.query(
      `
        INSERT INTO coupons (
          id, code, discount_type, discount_value, max_uses,
          usage_count, min_order_amount, valid_from, valid_until, status
        )
        VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8, 'active')
        ON CONFLICT (code) DO UPDATE
        SET discount_type = EXCLUDED.discount_type,
            discount_value = EXCLUDED.discount_value,
            max_uses = EXCLUDED.max_uses,
            min_order_amount = EXCLUDED.min_order_amount,
            valid_from = EXCLUDED.valid_from,
            valid_until = EXCLUDED.valid_until,
            status = 'active',
            updated_at = CURRENT_TIMESTAMP
      `,
      [
        coupon.id,
        coupon.code,
        coupon.discount_type,
        coupon.discount_value,
        coupon.max_uses,
        coupon.min_order_amount,
        coupon.valid_from,
        coupon.valid_until,
      ]
    );
  }
}

async function run() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await seedCategories(client);
    await seedProducts(client);
    await seedVariants(client);
    await seedDeliveryConfigs(client);
    await seedCoupons(client);
    await client.query('COMMIT');

    console.log(`Seeded ${categories.length} categories, ${products.length} products, ${variants.length} variants.`);
    console.log(`Seeded ${deliveryConfigs.length} delivery configs and ${coupons.length} coupons.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
