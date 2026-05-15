# 🎂 Bánh Kem Online - Complete Setup Guide

## ✅ What's Completed

### Backend (Node.js/Express)
- ✅ All API routes defined
- ✅ All controllers implemented
- ✅ All services completed with full CRUD operations
- ✅ Authentication & Admin middleware
- ✅ SendGrid email integration
- ✅ VNPay payment integration
- ✅ Coupon system with validation
- ✅ Order management
- ✅ User profile & address management
- ✅ Product variant management
- ✅ Error handling & logging

### Frontend (React + Vite)
- ✅ All page components created
- ✅ Complete API client layer
- ✅ Authentication flow
- ✅ Shopping cart functionality
- ✅ Checkout with delivery & payment
- ✅ Admin dashboard
- ✅ Responsive UI with Tailwind CSS
- ✅ Toast notifications
- ✅ Token refresh auto-handling

### Database
- ✅ PostgreSQL schema designed (001-init-schema.sql)
- ✅ All tables created (users, products, orders, payments, coupons, etc.)
- ✅ UUID support enabled

---

## 🚀 Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
# Start PostgreSQL & Redis
docker-compose up -d

# Wait for services to be healthy
docker-compose ps

# Expected output:
# NAME                STATUS
# banh_kem_postgres   Up (healthy)
# banh_kem_redis      Up (healthy)
```

### Option 2: Manual Setup on Windows

#### Install PostgreSQL
1. Download from: https://www.postgresql.org/download/windows/
2. Run installer and remember your password
3. Add PostgreSQL bin to PATH (or use full path `C:\Program Files\PostgreSQL\15\bin\psql`)

#### Create Database
```powershell
# Connect to PostgreSQL as admin
psql -U postgres

# In PostgreSQL shell:
CREATE USER banh_kem_user WITH PASSWORD 'banh_kem_password';
CREATE DATABASE banh_kem_db OWNER banh_kem_user;
ALTER DATABASE banh_kem_db SET search_path TO public;

# Exit
\q
```

#### Install Redis (Optional for Development)
Download from: https://github.com/microsoftarchive/redis/releases

Or use:
```powershell
winget install Redis.Redis
```

---

## 🔧 Environment Setup

### 1. Backend Configuration

**File:** `backend/.env`

```ini
# Server
NODE_ENV=development
PORT=5000
API_BASE_URL=http://localhost:5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=banh_kem_user
DB_PASSWORD=banh_kem_password
DB_NAME=banh_kem_db

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here_change_in_production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# VNPay (Get from VNPay Sandbox)
VNPAY_TMN_CODE=YOUR_MERCHANT_CODE
VNPAY_HASH_SECRET=YOUR_HASH_SECRET
VNPAY_API_URL=https://sandbox.vnpayment.vn
VNPAY_RETURN_URL=http://localhost:3000/checkout/return
VNPAY_NOTIFY_URL=http://localhost:5000/api/payments/vnpay/ipn

# SendGrid (Optional for Email)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@banhkem.com

# Admin
ADMIN_EMAIL=admin@banhkem.com
ADMIN_PASSWORD=change_me_in_production

# Features
MIN_DELIVERY_ADVANCE_HOURS=48
CART_EXPIRY_DAYS=30
SESSION_EXPIRY_DAYS=7
```

### 2. Frontend Configuration

**File:** `frontend/.env`

```ini
VITE_API_URL=http://localhost:5000
VITE_ADMIN_EMAIL=admin@banhkem.com
```

---

## 📦 Installation & Running

### Step 1: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 2: Run Database Migrations

```bash
cd backend
npm run migrate
```

Expected output:
```
Starting database migrations...
Running migration: 001-init-schema.sql
✓ Migration 001-init-schema.sql completed
✓ All migrations completed successfully!
```

### Step 3: Seed Sample Data (Optional)

```bash
npm run seed
```

### Step 4: Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Output:
```
[INFO] ... - Server running on port 5000 in development mode
[INFO] ... - Database connected successfully
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Output:
```
VITE v4.5.14  ready in 123 ms
➜  Local:   http://localhost:3000/
```

### Step 5: Verify Setup

1. **Frontend**: Open http://localhost:3000
2. **Backend Health**: `curl http://localhost:5000/health`
3. **API Test**: Use Postman/Insomnia to test endpoints

---

## 🔐 Authentication Flow

### Register/Login
```bash
# Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "phone": "0901234567"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "User Name"
  }
}
```

### Use Token
Include in all requests:
```
Authorization: Bearer <token>
```

### Admin Access
Email `admin@banhkem.com` (from .env) gets admin privileges automatically

---

## 🛒 Shopping Flow

### 1. Get Products
```bash
GET /api/products
```

### 2. Add to Cart
```bash
POST /api/cart/add
{
  "variantId": "uuid",
  "quantity": 2
}
```

### 3. Apply Coupon
```bash
POST /api/cart/apply-coupon
{
  "couponCode": "DISCOUNT20"
}
```

### 4. Create Order
```bash
POST /api/orders
{
  "shippingAddressId": "uuid",
  "requestedDeliveryDate": "2026-05-15",
  "requestedDeliveryTime": "morning",
  "paymentMethod": "vnpay"
}
```

### 5. Checkout with VNPay
```bash
POST /api/payments/vnpay/checkout
{
  "orderId": "uuid",
  "amount": 500000,
  "orderDescription": "Bánh kem sinh nhật"
}

Response: {
  "vnpayUrl": "https://sandbox.vnpayment.vn/..."
}
```

---

## 📊 Admin API Endpoints

All admin endpoints require `Authorization: Bearer <admin_token>`

### Orders
```bash
GET    /api/admin/orders?status=pending&limit=50&offset=0
GET    /api/admin/orders/:orderId
PATCH  /api/admin/orders/:orderId/status
```

### Products
```bash
GET    /api/admin/products?category=uuid&status=active
POST   /api/admin/products
PATCH  /api/admin/products/:productId
```

### Variants
```bash
POST   /api/admin/products/:productId/variants
PATCH  /api/admin/variants/:variantId
DELETE /api/admin/variants/:variantId
```

### Coupons
```bash
GET    /api/admin/coupons
POST   /api/admin/coupons
PATCH  /api/admin/coupons/:couponId
DELETE /api/admin/coupons/:couponId
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Run Specific Test
```bash
npm test -- auth.routes.test.js
```

---

## 🐛 Troubleshooting

### Backend Won't Start
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: PostgreSQL not running. Install and start PostgreSQL, or use Docker.

### Frontend Can't Connect to Backend
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
```
**Solution**: Backend not running. Make sure you started backend on port 5000.

### Redis Connection Error
```
Error: connect ECONNREFUSED ::1:6379
```
**Solution**: Redis is optional. If not used, errors are logged but not fatal. Remove REDIS_HOST from .env to disable it.

### Database Already Exists
```
error: database "banh_kem_db" already exists
```
**Solution**: Drop existing database and recreate:
```bash
psql -U postgres
DROP DATABASE banh_kem_db;
CREATE DATABASE banh_kem_db OWNER banh_kem_user;
\q
npm run migrate
```

---

## 📝 Project Structure

```
website_banh_kem/
├── backend/
│   ├── src/
│   │   ├── app.js              # Express app setup
│   │   ├── server.js           # Server entry point
│   │   ├── config/             # Configuration files
│   │   ├── controllers/        # Request handlers
│   │   ├── services/           # Business logic
│   │   ├── routes/             # API endpoints
│   │   ├── middlewares/        # Middleware functions
│   │   ├── migrations/         # Database schemas
│   │   ├── seeds/              # Sample data
│   │   └── utils/              # Utilities & helpers
│   ├── tests/                  # Jest tests
│   ├── .env                    # Environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main app component
│   │   ├── main.jsx            # Entry point
│   │   ├── api/                # API client functions
│   │   ├── pages/              # Page components
│   │   ├── components/         # Reusable components
│   │   ├── contexts/           # React contexts
│   │   ├── styles/             # CSS files
│   │   └── utils/              # Utilities
│   ├── .env                    # Environment variables
│   └── package.json
├── docs/                       # Documentation
├── docker-compose.yml          # Docker services
└── README.md
```

---

## 🚢 Production Deployment

### Before Deploying

1. **Update .env**
   - Change JWT secrets
   - Update VNPay credentials to production
   - Set NODE_ENV=production
   - Update API URLs

2. **Database**
   - Use managed PostgreSQL (AWS RDS, Heroku, etc.)
   - Run migrations on production database
   - Backup regularly

3. **Frontend Build**
   ```bash
   cd frontend
   npm run build
   ```

4. **Backend**
   ```bash
   cd backend
   npm start  # Production mode
   ```

### Recommended Platforms
- **Backend**: Heroku, Railway, Render, AWS, DigitalOcean
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Database**: AWS RDS, Heroku Postgres, Managed Cloud Services
- **Storage**: Cloudinary, AWS S3
- **Email**: SendGrid
- **Payments**: VNPay (Vietnam), Stripe (International)

---

## 📞 Support & Resources

- **VNPay Sandbox**: https://sandbox.vnpayment.vn
- **SendGrid Documentation**: https://docs.sendgrid.com
- **React Documentation**: https://react.dev
- **Express Documentation**: https://expressjs.com
- **PostgreSQL Documentation**: https://www.postgresql.org/docs

---

**Happy coding! 🎉**
