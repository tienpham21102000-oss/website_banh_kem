# 🚀 Hướng dẫn Triển khai lên Render.com (PostgreSQL)

## 1. Tạo Web Service trên Render

1. Đăng nhập [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Chọn repository: `tienpham21102000-oss/website_banh_kem`
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

## 2. Tạo PostgreSQL Database

1. Render Dashboard → **"New +"** → **"PostgreSQL"**
2. Đặt tên: `banh-kem-db`
3. Sau khi tạo xong, copy `Internal Database URL`

## 3. Cấu hình Environment Variables

Vào Web Service → **Environment** → thêm các biến:

```bash
# Bắt buộc
NODE_ENV=production
DATABASE_URL=<Internal Database URL từ bước 2>
JWT_SECRET=<mật khẩu bí mật - dùng random string>
JWT_REFRESH_SECRET=<mật khẩu bí mật khác>
SESSION_SECRET=<mật khẩu bí mật khác>
VITE_ADMIN_EMAIL=admin@banhkem.com
FRONTEND_URL=https://<tên-service>.onrender.com
API_BASE_URL=https://<tên-service>.onrender.com

# Facebook OAuth (tuỳ chọn)
FACEBOOK_APP_ID=2235435903938309
FACEBOOK_APP_SECRET=ee049bf32b130a58d267b7e7b79afd19

# VNPay Demo (tuỳ chọn)
VNPAY_TMN_CODE=DEMO_CODE
VNPAY_HASH_SECRET=DEMO_SECRET
```

## 4. Deploy

1. Click **"Manual Deploy"** → **"Deploy latest commit"**
2. Đợi build (~2-3 phút)

## 5. Chạy Migration & Seed (chỉ 1 lần)

Sau khi deploy thành công, vào **Shell** tab và chạy:

```bash
cd backend && npm run migrate
cd backend && npm run seed
```

## 6. Kiểm tra

- Web: `https://<tên-service>.onrender.com`
- Health API: `https://<tên-service>.onrender.com/health`
- Admin: `https://<tên-service>.onrender.com/admin` (đăng nhập bằng `admin@banhkem.com`)

## 7. Facebook OAuth (nếu dùng domain thật)

Vào [Meta for Developers](https://developers.facebook.com) → App của bạn → Facebook Login → Settings:
- Valid OAuth Redirect URIs: `https://<tên-service>.onrender.com/api/auth/facebook/callback`

---

> **Lưu ý**: Ở local (máy tính) dự án vẫn dùng SQLite tự động. PostgreSQL chỉ dùng khi có biến `DATABASE_URL`.