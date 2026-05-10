# 🍰 Website Tiệm Bánh Kem - Nghe Nghe Bakery

Chào mừng bạn đến với dự án Website Quản lý và Đặt bánh kem trực tuyến. Đây là một nền tảng chuyên nghiệp, tinh tế và đầy đủ tính năng dành cho cả khách hàng và quản trị viên.

## 🌟 Trạng thái Dự án hiện tại (Cập nhật: 09/05/2026)

Dự án đã hoàn tất các giai đoạn cốt lõi và đang trong trạng thái **Sẵn sàng triển khai (Production Ready)**.

### 1. Tính năng dành cho Khách hàng
*   **Catalog Bánh Kem:** Giao diện trưng bày bánh hiện đại, phân loại rõ ràng.
*   **Giỏ hàng thông minh:** Hỗ trợ tính toán giá dựa trên biến thể (Size, Topping).
*   **Quy trình Thanh toán:** Tích hợp Step Indicator, hỗ trợ Demo thanh toán VNPay.
*   **Lịch sử đơn hàng:** Theo dõi trạng thái đơn hàng cá nhân.
*   **Chế độ Open Access:** Tự động nhận diện khách vãng lai (Guest) để trải nghiệm mua sắm không cần đăng ký.

### 2. Hệ thống Quản trị (Admin Dashboard) chuyên sâu
*   **Giao diện Sidebar:** Chia tabs khoa học (Tổng quan, Đơn hàng, Sản phẩm, Biến thể, Mã giảm giá).
*   **Bảo mật:** Ẩn Menu Admin đối với người dùng thường, chỉ hiển thị cho Email cấu hình cụ thể.
*   **Quản lý Biến thể:** Khu vực riêng biệt để quản lý Size, Topping và Tồn kho cho từng loại bánh.
*   **Công cụ Đơn hàng:** Tìm kiếm mã đơn, lọc theo khoảng thời gian và **Xuất báo cáo CSV/Excel**.
*   **Quản lý Coupon:** Tạo và quản lý mã giảm giá linh hoạt.

### 3. Kỹ thuật & Triển khai
*   **Fullstack Serving:** Backend Node.js tự phục vụ giao diện Frontend (Production mode).
*   **Database linh hoạt:** 
    *   **Local:** Sử dụng SQLite (nhanh, gọn).
    *   **Production:** Hỗ trợ PostgreSQL (ổn định, lưu trữ vĩnh viễn trên Render/Heroku).
*   **Cấu hình Deploy:** Đã có sẵn root `package.json` và `Procfile` cho việc triển khai 1-click.

## 🛠️ Công nghệ sử dụng
*   **Frontend:** React.js, Vite, Vanilla CSS (Premium Design), React Router.
*   **Backend:** Node.js, Express.
*   **Database:** SQLite / PostgreSQL (qua raw wrapper tối ưu).
*   **Thanh toán:** Demo VNPay Integration.

## 🚀 Hướng dẫn Triển khai nhanh (Render.com)
1.  **Build Command:** `npm run install:all && npm run build:frontend`
2.  **Start Command:** `npm start`
3.  **Environment Variables:**
    *   `DATABASE_URL`: Link PostgreSQL (để giữ dữ liệu vĩnh viễn).
    *   `NODE_ENV`: `production`.
    *   `VITE_ADMIN_EMAIL`: Email được quyền truy cập Admin.
    *   `FRONTEND_URL`: URL frontend (Render sẽ dùng cùng domain backend khi serve `frontend/dist`).
    *   `API_BASE_URL`: URL backend (ví dụ `https://<service>.onrender.com`).
    *   `SESSION_SECRET`: Secret cho OAuth/session.
    *   `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`: Bật đăng nhập Facebook (tuỳ chọn).

### Bật đăng nhập Facebook trên Render (domain thật)
1. Tạo Facebook App (Meta for Developers) và lấy `FACEBOOK_APP_ID` + `FACEBOOK_APP_SECRET`.
2. Trong Meta → Facebook Login → Settings:
   - Valid OAuth Redirect URIs: `https://<service>.onrender.com/api/auth/facebook/callback`
3. Trên Render → Environment:
   - `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`
   - `FRONTEND_URL=https://<service>.onrender.com`
   - `API_BASE_URL=https://<service>.onrender.com`
4. Redeploy service.

### Khởi tạo Database trên Render (PostgreSQL)
1. Render → tạo `PostgreSQL` và copy `DATABASE_URL` vào Web Service → Environment.
2. Redeploy để app chạy với Postgres.
3. Web Service → tab `Shell` (hoặc SSH) chạy 1 lần:
   - `cd backend && npm run migrate`
   - `cd backend && npm run seed`

---
*Dự án được phát triển bởi Antigravity AI Assistant.*
