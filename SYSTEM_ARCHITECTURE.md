# 🏗️ Kiến trúc Hệ thống - Nghe Nghe Bakery

## 📋 Tổng quan

Hệ thống **Nghe Nghe Bakery** là một nền tảng đặt bánh kem trực tuyến full-stack, được xây dựng bằng **React + Vite (Frontend)** và **Node.js + Express (Backend)**, sử dụng **PostgreSQL** làm cơ sở dữ liệu.

```
┌─────────────────────────────────────────────────────────────────┐
│                      Render.com (Web Service)                   │
│                                                                  │
│  ┌─────────────────────┐      ┌─────────────────────────────┐  │
│  │   Frontend (React)  │◄────►│   Backend (Express API)     │  │
│  │   port 3000 (dev)   │      │   port 5000                 │  │
│  │   served by Node    │      │                             │  │
│  │   in production     │      │  /api/auth/*                │  │
│  └─────────────────────┘      │  /api/products/*            │  │
│                                │  /api/orders/*              │  │
│                                │  /api/cart/*                │  │
│                                │  /api/payments/*            │  │
│                                │  /api/admin/*               │  │
│                                └──────────┬──────────────────┘  │
│                                           │                     │
│                                ┌──────────▼──────────────────┐  │
│                                │  PostgreSQL (Render)        │  │
│                                │  External Database Service  │  │
│                                │  Tables:                    │  │
│                                │  - users                    │  │
│                                │  - oauth_accounts           │  │
│                                │  - products                 │  │
│                                │  - product_variants         │  │
│                                │  - categories               │  │
│                                │  - orders                   │  │
│                                │  - order_items              │  │
│                                │  - payments                 │  │
│                                │  - coupons                  │  │
│                                │  - coupon_usages            │  │
│                                │  - user_addresses           │  │
│                                │  - delivery_window_config   │  │
│                                └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Cấu trúc thư mục

```
website_banh_kem/
│
├── backend/                          # Backend Node.js + Express
│   ├── .env.example                  # Mẫu biến môi trường (đã cập nhật)
│   ├── package.json                  # Dependencies: express, pg, passport, jwt...
│   ├── src/
│   │   ├── server.js                 # Entry point - chạy migrations + start server
│   │   ├── app.js                    # Cấu hình Express app (middleware, routes, static)
│   │   ├── config/
│   │   │   ├── env.js                # Load & export biến môi trường
│   │   │   ├── database.js           # Kết nối PostgreSQL (Pool)
│   │   │   ├── passport.js           # Cấu hình Facebook OAuth Strategy
│   │   │   └── redis.js              # Mock Redis (in-memory Map)
│   │   ├── controllers/
│   │   │   ├── AuthController.js     # Register, Login, Refresh, GetMe
│   │   │   ├── OAuthController.js    # Xử lý callback Facebook OAuth
│   │   │   ├── ProductController.js  # CRUD sản phẩm
│   │   │   ├── CartController.js     # Quản lý giỏ hàng
│   │   │   ├── OrderController.js    # Quản lý đơn hàng
│   │   │   ├── PaymentController.js  # Xử lý thanh toán (VNPay demo)
│   │   │   ├── AdminController.js    # Dashboard admin
│   │   │   ├── UsersController.js    # Thông tin người dùng
│   │   │   ├── CouponController.js   # Quản lý mã giảm giá
│   │   │   └── DeliveryController.js # Cấu hình giao hàng
│   │   ├── services/                 # Business logic layer
│   │   │   ├── AuthService.js        # Auth + OAuth logic (findOrCreateOAuthUser)
│   │   │   ├── ProductService.js
│   │   │   ├── CartService.js
│   │   │   ├── OrderService.js
│   │   │   ├── PaymentService.js
│   │   │   ├── CouponService.js
│   │   │   ├── DeliveryWindowService.js
│   │   │   └── NotificationService.js
│   │   ├── routes/                   # Route handlers
│   │   │   ├── auth.routes.js        # POST /login, /register, /refresh + GET /facebook/*
│   │   │   ├── products.routes.js
│   │   │   ├── cart.routes.js
│   │   │   ├── orders.routes.js
│   │   │   ├── payments.routes.js
│   │   │   ├── users.routes.js
│   │   │   ├── coupons.routes.js
│   │   │   ├── delivery.routes.js
│   │   │   └── admin.routes.js
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js     # JWT auth, optional auth, admin check
│   │   │   └── errorHandler.middleware.js  # Global error handler
│   │   ├── migrations/
│   │   │   ├── 001-init-schema.sql   # Tạo toàn bộ schema (users, products, orders...)
│   │   │   ├── 002-oauth-accounts.sql# Tạo bảng oauth_accounts
│   │   │   └── migrate.js            # Script chạy migration
│   │   ├── seeds/
│   │   │   └── sample-products.js    # Seed dữ liệu mẫu
│   │   └── utils/
│   │       ├── constant.js           # Constants: status codes, messages...
│   │       └── logger.js             # Logger đơn giản (console)
│   └── tests/                        # Jest test suites
│
├── frontend/                         # Frontend React + Vite
│   ├── .env.example                  # Mẫu biến môi trường frontend
│   ├── package.json                  # Dependencies: react, react-router, axios...
│   ├── vite.config.js                # Vite config (proxy /api → backend)
│   ├── src/
│   │   ├── main.jsx                  # Entry point React
│   │   ├── App.jsx                   # Root component: routing, auth modal, layout
│   │   ├── App.css                   # Styles
│   │   ├── api/
│   │   │   ├── client.js             # Axios instance + interceptors (token, refresh)
│   │   │   ├── authAPI.js            # Login, register, logout API calls
│   │   │   ├── productAPI.js
│   │   │   ├── cartAPI.js
│   │   │   ├── orderAPI.js
│   │   │   ├── paymentAPI.js
│   │   │   ├── adminAPI.js
│   │   │   ├── couponAPI.js
│   │   │   └── deliveryAPI.js
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx       # React Context cho auth state
│   │   │   └── CartContext.jsx       # React Context cho cart state
│   │   ├── pages/
│   │   │   ├── Home.jsx              # Trang chủ
│   │   │   ├── Catalog.jsx           # Danh mục sản phẩm
│   │   │   ├── Cart.jsx              # Giỏ hàng
│   │   │   ├── Checkout.jsx          # Thanh toán
│   │   │   ├── CheckoutReturn.jsx    # Kết quả thanh toán VNPay
│   │   │   ├── OrderHistory.jsx      # Lịch sử đơn hàng
│   │   │   ├── AdminDashboard.jsx    # Dashboard quản trị
│   │   │   └── FacebookAuthCallback.jsx  # Xử lý callback Facebook OAuth
│   │   ├── components/
│   │   │   ├── Header.jsx            # Navigation bar
│   │   │   └── Footer.jsx            # Footer
│   │   ├── styles/
│   │   │   └── global.css            # Global CSS (Tailwind-like)
│   │   └── utils/
│   │       └── helpers.js            # Utility functions
│   └── dist/                         # Build output (served in production)
│
├── package.json                      # Root: install:all, build:frontend, start
├── Procfile                          # Render start command: npm start
├── DEPLOY_RENDER.md                  # Hướng dẫn deploy Render (đã cập nhật)
├── SYSTEM_ARCHITECTURE.md            # Tài liệu này
├── README.md                         # README tổng quan
├── SETUP_GUIDE.md                    # Hướng dẫn setup local
├── QUICKSTART.md                     # Quickstart guide
├── RUN_PROJECT.bat                   # Script chạy project (Windows)
└── setup.ps1                         # Script setup (Windows)
```

---

## 🔐 Luồng Xác thực (Authentication Flow)

### 1. Đăng nhập bằng Email/Password

```
Client                          Server (Express)              PostgreSQL
  │                                │                            │
  │  POST /api/auth/login          │                            │
  │  { email, password }           │                            │
  │ ──────────────────────────►   │                            │
  │                                │  SELECT * FROM users       │
  │                                │  WHERE email = $1          │
  │                                │ ───────────────────────►  │
  │                                │ ◄───────────────────────  │
  │                                │                            │
  │                                │  bcrypt.compare(password)  │
  │                                │                            │
  │  { user, token, refreshToken } │                            │
  │ ◄──────────────────────────   │                            │
```

### 2. Đăng nhập bằng Facebook (OAuth 2.0)

```
  Client [Browser]           Backend (Express)        Facebook (Meta)
       │                         │                       │
       │ Click "Đăng nhập Facebook"                     │
       │────────────────────────►│                       │
       │                         │ Redirect to Facebook  │
       │                         │──────────────────────►│
       │                         │                       │
       │   [User logs in on Facebook]                   │
       │                         │                       │
       │                         │◄─── Code + State ────│
       │                         │                       │
       │                         │ passport.authenticate │
       │                         │ (code → accessToken)  │
       │                         │──────────────────────►│
       │                         │◄─── profile data ────│
       │                         │                       │
       │                         │ findOrCreateOAuthUser │
       │                         │ (provider, providerUserId)│
       │                         │──────────────────────►│
       │                         │◄──── user row ───────│
       │                         │                       │
       │ Redirect to frontend    │                       │
       │ /auth/facebook/callback?token=xxx               │
       │◄────────────────────────│                       │
       │                         │                       │
       │ [Frontend parses token] │                       │
       │ GET /api/auth/me        │                       │
       │────────────────────────►│                       │
       │◄──── user data ────────│                       │
       │                         │                       │
```

### 3. Token Refresh (Auto)

Khi token hết hạn (401), Axios interceptor trong `api/client.js` tự động:
- Gọi `POST /api/auth/refresh` với refreshToken
- Lưu token mới vào localStorage
- Retry request ban đầu

---

## 🗄️ Database Schema

### Bảng `users`
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | UUID | Primary key |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| phone | VARCHAR(20) | UNIQUE, nullable |
| password_hash | VARCHAR(255) | NULL for OAuth users |
| display_name | VARCHAR(255) | |
| verified_email | BOOLEAN | default false |
| verified_phone | BOOLEAN | default false |
| loyalty_points | INT | default 0 |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | Auto-update trigger |

### Bảng `oauth_accounts`
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | UUID | Primary key |
| provider | VARCHAR(50) | 'facebook', 'google' |
| provider_user_id | VARCHAR(255) | ID từ provider |
| user_id | UUID | FK → users.id |
| UNIQUE(provider, provider_user_id) | | Chống trùng |

### Bảng `products`, `categories`, `product_variants`
- Quan hệ: Category 1→N Products 1→N Variants
- `base_price` + `price_adjustment` (variant) = giá cuối

### Bảng `orders`, `order_items`, `payments`
- Order có status: pending → confirmed → paid → processing → shipped → delivered
- Payment có gateway: 'vnpay', 'momo', 'cod'

### Bảng `coupons`, `coupon_usages`
- Discount type: 'percentage' hoặc 'fixed'
- Coupon usage được audit qua coupon_usages

---

## 🌐 Deployment trên Render

### Kiến trúc Render

```
Internet
    │
    ▼
Render Load Balancer (HTTPS auto)
    │
    ▼
Web Service (Node.js 20.x)
    ├── npm run install:all    (cài cả backend + frontend)
    ├── npm run build:frontend (build React → backend/../frontend/dist)
    └── npm start              (chạy backend, tự serve frontend static)
         │
         └── Kết nối tới PostgreSQL (Render external service)
              └── DATABASE_URL internal connection string
```

### Biến môi trường bắt buộc trên Render

| Variable | Mô tả | Ví dụ |
|----------|-------|-------|
| `NODE_ENV` | Môi trường | `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `JWT_SECRET` | Secret cho JWT | (random 64-byte hex) |
| `JWT_REFRESH_SECRET` | Secret cho refresh token | (random 64-byte hex) |
| `SESSION_SECRET` | Secret cho session | (random string) |
| `API_BASE_URL` | Backend URL | `https://banh-kem.onrender.com` |
| `FRONTEND_URL` | Frontend URL | `https://banh-kem.onrender.com` |

### Biến môi trường tuỳ chọn

| Variable | Mô tả |
|----------|-------|
| `FACEBOOK_APP_ID` | Facebook App ID (bật đăng nhập Facebook) |
| `FACEBOOK_APP_SECRET` | Facebook App Secret |
| `ADMIN_EMAIL` | Email admin (mặc định: admin@banhkem.com) |
| `ADMIN_PASSWORD` | Password admin (mặc định: admin123) |
| `VNPAY_TMN_CODE` | Mã merchant VNPay |
| `VNPAY_HASH_SECRET` | Secret VNPay |

---

## 🔧 Các thành phần quan trọng cần lưu ý

### 1. Auto Migration
Khi server khởi động (`server.js`), tự động chạy tất cả file `.sql` trong `backend/src/migrations/` theo thứ tự. Nếu bảng đã tồn tại, migration sẽ được bỏ qua.

### 2. Mock Redis
Vì Render Free tier không hỗ trợ Redis, hệ thống dùng in-memory Map mock (file `redis.js`). Dữ liệu giỏ hàng sẽ mất khi server restart. Đây là giới hạn của free tier.

### 3. Serving Frontend
- **Production**: Backend tự serve file static từ `frontend/dist/` (Node = web server duy nhất).
- **Development**: Dùng Vite dev server (port 3000) với proxy `/api` → backend (port 5000).

### 4. Facebook OAuth Callback
- Passport strategy tự động phát hiện URL dựa trên `API_BASE_URL`.
- Trong OAuthController, sau khi xác thực thành công, redirect về frontend với token trong URL params.
- Frontend component `FacebookAuthCallback.jsx` parse token và gọi `/api/auth/me` để lấy thông tin user.

### 5. Bảo mật
- Session OAuth chỉ tồn tại 15 phút (chỉ dùng cho handshake).
- JWT token có thời hạn 24h, refresh token 7 ngày.
- Admin route được bảo vệ bằng `adminMiddleware` - kiểm tra email khớp với `ADMIN_EMAIL`.

---

## 🚀 Quick Deploy Checklist

- [ ] Fork/push code lên GitHub
- [ ] Tạo Web Service trên Render (kết nối GitHub repo)
- [ ] Build command: `npm run install:all && npm run build:frontend`
- [ ] Start command: `npm start`
- [ ] Tạo PostgreSQL trên Render, copy Internal Database URL
- [ ] Set environment variables trên Render
- [ ] Deploy lần đầu
- [ ] Vào Shell tab: `cd backend && npm run migrate && npm run seed`
- [ ] Kiểm tra: `https://app.onrender.com/health`
- [ ] (Optional) Cấu hình Facebook OAuth trong Meta Dashboard