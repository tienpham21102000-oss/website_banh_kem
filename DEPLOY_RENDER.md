# 🚀 Hướng dẫn Triển khai lên Render.com (PostgreSQL + Facebook OAuth)

## Mục lục
1. [Tạo Web Service](#1-tạo-web-service-trên-render)
2. [Tạo PostgreSQL Database](#2-tạo-postgresql-database)
3. [Cấu hình Environment Variables](#3-cấu-hình-environment-variables)
4. [Deploy](#4-deploy)
5. [Chạy Migration & Seed](#5-chạy-migration--seed-chỉ-1-lần)
6. [Kiểm tra](#6-kiểm-tra)
7. [Facebook OAuth](#7-facebook-oauth-nếu-cần)
8. [Xử lý sự cố thường gặp](#8-xử-lý-sự-cố-thường-gặp)

---

## 1. Tạo Web Service trên Render

1. Đăng nhập [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Kết nối GitHub repository: `tienpham21102000-oss/website_banh_kem`
4. Cấu hình:

| Trường | Giá trị |
|--------|---------|
| **Name** | `banh-kem` (hoặc tên bạn muốn) |
| **Region** | `Singapore` (gần Việt Nam nhất) |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm run install:all && npm run build:frontend` |
| **Start Command** | `npm start` |
| **Plan** | `Free` |

> **Lưu ý**: Build command sẽ cài dependencies cho cả backend và frontend, sau đó build frontend React ra thư mục `frontend/dist/`.

---

## 2. Tạo PostgreSQL Database

1. Render Dashboard → **"New +"** → **"PostgreSQL"**
2. Đặt tên: `banh-kem-db`
3. Region: `Singapore`
4. Chọn **"Free"** plan
5. Sau khi tạo xong (khoảng 1-2 phút), copy **"Internal Database URL"** (dạng: `postgresql://user:password@host:port/dbname`)
6. Giữ tab này mở, bạn sẽ cần nó ở bước tiếp theo

> ⚠️ **Quan trọng**: Dùng **Internal Database URL** (không phải External) để kết nối nhanh hơn và không tốn bandwidth.

---

## 3. Cấu hình Environment Variables

Vào Web Service → **Environment** → thêm các biến sau:

### Bắt buộc
```bash
NODE_ENV=production

# Database (dán Internal Database URL từ bước 2)
DATABASE_URL=postgresql://user:password@host:port/banh_kem_db
PGSSLMODE=require

# Bảo mật - tạo bằng lệnh: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<random_64_byte_hex_string_1>
JWT_REFRESH_SECRET=<random_64_byte_hex_string_2>
SESSION_SECRET=<random_string>

# URL ứng dụng (thay <tên-service> bằng tên bạn đặt ở bước 1)
API_BASE_URL=https://<tên-service>.onrender.com
FRONTEND_URL=https://<tên-service>.onrender.com
```

### Tuỳ chọn (bỏ qua nếu chưa cần)
```bash
# Facebook OAuth (xem hướng dẫn ở mục 7)
FACEBOOK_APP_ID=<your_facebook_app_id>
FACEBOOK_APP_SECRET=<your_facebook_app_secret>

# Admin mặc định
ADMIN_EMAIL=admin@banhkem.com
ADMIN_PASSWORD=admin123

# VNPay Demo
VNPAY_TMN_CODE=DEMO_CODE
VNPAY_HASH_SECRET=DEMO_SECRET
VNPAY_RETURN_URL=https://<tên-service>.onrender.com/checkout/return
```

### Cách tạo secret an toàn
Mở terminal và chạy:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Output mẫu: 8f3a2b1c... (128 ký tự hex)
```

Lặp lại 3 lần để lấy 3 secret khác nhau cho `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET`.

---

## 4. Deploy

1. Click **"Manual Deploy"** → **"Deploy latest commit"**
2. Chờ build và deploy (~2-3 phút cho lần đầu, lần sau nhanh hơn)
3. Khi thấy dòng `Server running on port 10000 in production mode` là thành công

---

## 5. Chạy Migration & Seed (chỉ 1 lần)

Sau khi deploy thành công, vào **Shell** tab trên Render Web Service và chạy:

```bash
# Di chuyển vào thư mục backend
cd backend

# Chạy migration (tạo bảng)
npm run migrate

# Seed dữ liệu mẫu (sản phẩm, danh mục, mã giảm giá, tài khoản admin)
npm run seed
```

Output kỳ vọng:
```
✓ Migration 001-init-schema.sql completed
✓ Migration 002-oauth-accounts.sql completed
✓ All migrations completed successfully!
Seeded 2 categories, 3 products, 6 variants...
```

> ⚠️ **Chạy 1 lần duy nhất**. Nếu chạy lại seed, nó sẽ update dữ liệu (upsert) thay vì tạo trùng.

---

## 6. Kiểm tra

Sau khi deploy và seed thành công:

| Kiểm tra | URL |
|----------|-----|
| **Trang chủ** | `https://<tên-service>.onrender.com` |
| **Health Check** | `https://<tên-service>.onrender.com/health` |
| **API Products** | `https://<tên-service>.onrender.com/api/products` |
| **Admin Dashboard** | `https://<tên-service>.onrender.com/admin` |

**Đăng nhập admin:**
- Email: `admin@banhkem.com`
- Password: `admin123`

---

## 7. Facebook OAuth (nếu cần)

### 7.1. Tạo Facebook App
1. Vào [Meta for Developers](https://developers.facebook.com)
2. **"Create App"** → Chọn **"Consumer"**
3. Điền thông tin cơ bản
4. Vào **"Dashboard"** → copy `App ID` và `App Secret`

### 7.2. Cấu hình Facebook Login
1. Trong app của bạn → **"Facebook Login"** → **"Settings"**
2. Thêm vào **"Valid OAuth Redirect URIs"**:
   ```
   https://<tên-service>.onrender.com/api/auth/facebook/callback
   ```
3. Bật **"Embedded Browser OAuth Login"** = Yes
4. **"Save Changes"**

### 7.3. Thêm Environment Variables trên Render
```
FACEBOOK_APP_ID=<App ID từ bước 7.1>
FACEBOOK_APP_SECRET=<App Secret từ bước 7.1>
```

### 7.4. Redeploy
1. **"Manual Deploy"** → **"Deploy latest commit"**
2. Kiểm tra status: `https://<tên-service>.onrender.com/api/auth/facebook/status`

---

## 8. Xử lý sự cố thường gặp

### ❌ Lỗi: `Error: connect ECONNREFUSED` (kết nối database)
- **Nguyên nhân**: PostgreSQL chưa sẵn sàng hoặc sai `DATABASE_URL`
- **Khắc phục**: Kiểm tra lại `DATABASE_URL` trong Environment, đảm bảo dùng **Internal Database URL**

### ❌ Lỗi: `Cannot find module` (thiếu dependency)
- **Nguyên nhân**: Build command chưa chạy xong hoặc lỗi
- **Khắc phục**: Vào **"Events"** tab, kiểm tra log build. Chạy lại **"Manual Deploy"**.

### ❌ Lỗi: `Migration failed: relation "users" already exists`
- **Nguyên nhân**: Chạy migration 2 lần
- **Khắc phục**: Bỏ qua, đây là warning (migration dùng `IF NOT EXISTS`)

### ❌ Lỗi: `Facebook login returns "Can't load URL"`
- **Nguyên nhân**: Sai cấu hình OAuth Redirect URI trên Meta Dashboard
- **Khắc phục**: Kiểm tra lại URI chính xác: `https://<domain>/api/auth/facebook/callback`

### ❌ Lỗi: `Token đã hết hạn`
- **Nguyên nhân**: JWT token hết 24h
- **Khắc phục**: Dùng refresh token tự động (client đã xử lý tự động qua Axios interceptor)

### ❌ Trang không tìm thấy (404) khi refresh route
- **Nguyên nhân**: Frontend chưa được build hoặc chưa deploy đúng
- **Khắc phục**: Kiểm tra `NODE_ENV=production` đã set chưa. Nếu dùng `NODE_ENV=development` thì backend sẽ không serve static frontend.

---

## 📋 Quick Reference

| Thao tác | Command/Link |
|----------|-------------|
| Build | `npm run install:all && npm run build:frontend` |
| Start | `npm start` |
| Migration | `cd backend && npm run migrate` |
| Seed | `cd backend && npm run seed` |
| Health | `GET /health` → `{"status":"ok"}` |
| Facebook Status | `GET /api/auth/facebook/status` |

---

> **Lưu ý cho Dev Local**: Ở local bạn chỉ cần `cd backend && npm run dev` là đủ (không cần build frontend). Backend chạy ở port 5000, frontend Vite dev server ở port 3000 (tự động proxy /api → backend).