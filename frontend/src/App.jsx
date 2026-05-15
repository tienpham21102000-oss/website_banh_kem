import { useState, useEffect } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { Toaster, toast } from 'react-hot-toast'
import './App.css'
import CatalogPage from './pages/Catalog'
import HomePage from './pages/Home'
import CartPage from './pages/Cart'
import CheckoutPage from './pages/Checkout'
import CheckoutReturnPage from './pages/CheckoutReturn'
import AdminDashboardPage from './pages/AdminDashboard'
import { login, logout, register } from './api/authAPI'
import OrderHistoryPage from './pages/OrderHistory'
import FacebookAuthCallback from './pages/FacebookAuthCallback'
import { getErrorMessage } from './utils/helpers'

// Hiển thị toast error khi Facebook OAuth redirect về với ?error=...
function OAuthErrorHandler() {
  const location = useLocation()
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const error = params.get('error')
    if (error && error !== 'null') {
      const msg = decodeURIComponent(error)
      toast.error(msg === 'facebook_auth_failed'
        ? 'Đăng nhập Facebook thất bại. Vui lòng thử lại.'
        : msg === 'no_authorization_code'
          ? 'Không nhận được mã xác thực từ Facebook.'
          : `Lỗi đăng nhập: ${msg}`,
        { duration: 5000 }
      )
      // Xoá query param khỏi URL mà không reload trang
      window.history.replaceState({}, '', location.pathname)
    }
  }, [location.search])
  return null
}

function App() {
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@banhkem.com'
  const apiBaseUrl =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api')
  const enableAdminDemo = import.meta.env.DEV && (import.meta.env.VITE_ENABLE_ADMIN_DEMO === 'true')
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ email: '', password: '', phone: '' })
  const [authLoading, setAuthLoading] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [session, setSession] = useState(() => {
    const token = localStorage.getItem('authToken')
    const refreshToken = localStorage.getItem('refreshToken')
    const storedUser = localStorage.getItem('authUser')

    if (token && storedUser) {
      return {
        token,
        refreshToken,
        user: JSON.parse(storedUser),
      }
    }

    // Default Guest Session for "Open Access" deployment
    return {
      token: null,
      refreshToken: null,
      user: { id: 'guest-user', email: 'guest@banhkem.com', role: 'customer' },
    }
  })

  const handleAuthFieldChange = (event) => {
    const { name, value } = event.target
    setAuthForm((current) => ({ ...current, [name]: value }))
  }

  const persistSession = (data) => {
    localStorage.setItem('authToken', data.token)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('authUser', JSON.stringify(data.user))

    setSession({
      token: data.token,
      refreshToken: data.refreshToken,
      user: data.user,
    })
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthLoading(true)

    try {
      const action = authMode === 'login'
        ? login(authForm.email, authForm.password)
        : register(authForm.email, authForm.password, authForm.phone)

      const { data } = await action
      persistSession(data)
      setAuthForm({ email: authForm.email, password: '', phone: authForm.phone })
      setAuthOpen(false)
      toast.success(authMode === 'login' ? 'Đăng nhập thành công' : 'Tạo tài khoản thành công')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể xác thực tài khoản'))
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    setSession({ token: null, refreshToken: null, user: { id: 'guest-user', email: 'guest@banhkem.com', role: 'customer' } })
    toast.success('Đã đăng xuất')
  }

  return (
    <BrowserRouter>
      <OAuthErrorHandler />
      <div className="app-shell">
        <header className="topbar">
          <div className="brand-block">
            <Link to="/" className="brand-mark">BK</Link>
            <div>
              <p className="eyebrow">Tiệm Bánh Ngọt Trực Tuyến</p>
              <h1>Nghe Nghe Bakery - Bánh Kem Thiết Kế & Giao Tận Nơi</h1>
            </div>
          </div>

          <nav className="main-nav">
            <NavLink to="/">Trang chủ</NavLink>
            <NavLink to="/catalog">Danh mục</NavLink>
            <NavLink to="/cart">Giỏ hàng</NavLink>
            <NavLink to="/checkout">Thanh toán</NavLink>
            <NavLink to="/orders">Lịch sử</NavLink>
            {session.user?.email === adminEmail ? <NavLink to="/admin" className="admin-link">Quản trị</NavLink> : null}
          </nav>

          <div className="session-panel">
            {session.user && session.user.id !== 'guest-user' ? (
              <div className="session-card">
                <p className="session-label">Đang đăng nhập với</p>
                <strong>{session.user.email}</strong>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button type="button" className="ghost-button" onClick={handleLogout}>
                    Đăng xuất
                  </button>
                  {enableAdminDemo && session.user.email !== adminEmail && (
                    <button 
                      type="button" 
                      className="ghost-button" 
                      style={{ color: 'var(--accent)' }}
                      onClick={() => {
                        const adminSession = {
                          token: 'demo-admin-token',
                          user: { id: 'admin-id', email: adminEmail, role: 'admin' }
                        }
                        persistSession(adminSession)
                        toast.success('Đã đăng nhập quyền Quản trị')
                      }}
                    >
                      Quyền Admin
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="session-guest">
                <button type="button" className="primary-button auth-open-button" onClick={() => setAuthOpen(true)}>
                  Đăng nhập
                </button>
              </div>
            )}
          </div>
        </header>

        {authOpen && (
          <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) setAuthOpen(false)
            }}
          >
            <div className="modal-card">
              <div className="modal-header">
                <div>
                  <p className="eyebrow">Tài khoản</p>
                  <h2 className="modal-title">{authMode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h2>
                </div>
                <button type="button" className="modal-close" onClick={() => setAuthOpen(false)} aria-label="Đóng">
                  ×
                </button>
              </div>

              <form className="auth-card auth-card-modal" onSubmit={handleAuthSubmit}>
                <div className="auth-toggle">
                  <button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Đăng nhập</button>
                  <button type="button" className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>Đăng ký</button>
                </div>

                <input
                  name="email"
                  type="email"
                  placeholder="Địa chỉ Email"
                  value={authForm.email}
                  onChange={handleAuthFieldChange}
                  required
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Mật khẩu"
                  value={authForm.password}
                  onChange={handleAuthFieldChange}
                  required
                />
                {authMode === 'register' && (
                  <input
                    name="phone"
                    placeholder="Số điện thoại"
                    value={authForm.phone}
                    onChange={handleAuthFieldChange}
                  />
                )}

                <button type="submit" className="primary-button" disabled={authLoading}>
                  {authLoading ? 'Đang xử lý...' : authMode === 'login' ? 'Vào hệ thống' : 'Tạo tài khoản'}
                </button>

                <div className="auth-divider">
                  <span>Hoặc tiếp tục với</span>
                </div>

                <button
                  type="button"
                  className="facebook-button"
                  onClick={async () => {
                    const toastId = toast.loading('Đang kiểm tra cấu hình...')
                    try {
                      const response = await fetch(`${apiBaseUrl}/auth/facebook/status`)
                      const status = await response.json()
                      if (!status?.configured) {
                        toast.error(status?.message || 'Chưa cấu hình đăng nhập Facebook', { id: toastId })
                        return
                      }

                      toast.loading('Đang chuyển đến Facebook...', { id: toastId })
                      window.location.assign(`${apiBaseUrl}/auth/facebook`)
                    } catch (e) {
                      toast.error('Không thể kết nối máy chủ. Vui lòng thử lại.', { id: toastId })
                    }
                  }}
                >
                  <span className="fb-icon">f</span> Đăng nhập bằng Facebook
                </button>
              </form>
            </div>
          </div>
        )}

        <main className="page-shell">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage session={session} />} />
            <Route path="/products" element={<CatalogPage session={session} />} />
            <Route path="/cart" element={<CartPage session={session} />} />
            <Route path="/checkout" element={<CheckoutPage session={session} />} />
            <Route path="/checkout/return" element={<CheckoutReturnPage session={session} />} />
            <Route path="/auth/facebook/callback" element={<FacebookAuthCallback onAuth={persistSession} />} />
            <Route path="/orders" element={<OrderHistoryPage session={session} />} />
            <Route path="/admin" element={<AdminDashboardPage session={session} adminEmail={adminEmail} />} />
            <Route path="*" element={<div className="not-found">404 - Không tìm thấy trang</div>} />
          </Routes>
        </main>

        <footer className="footer">
          <div className="footer-content">
            <div className="footer-info">
              <h3 className="footer-brand">Nghe Nghe Bakery</h3>
              <p>
                Tiệm bánh kem thiết kế hàng đầu, mang đến những tác phẩm nghệ thuật ngọt ngào cho mọi bữa tiệc của bạn.
              </p>
            </div>
            <div className="footer-links">
              <h4>Liên kết nhanh</h4>
              <nav>
                <Link to="/">Trang chủ</Link>
                <Link to="/catalog">Sản phẩm</Link>
                <Link to="/cart">Giỏ hàng</Link>
              </nav>
            </div>
            <div className="footer-links">
              <h4>Hỗ trợ khách hàng</h4>
              <nav>
                <Link to="/orders">Đơn hàng của tôi</Link>
                <span>Chính sách bảo mật</span>
                <span>Điều khoản dịch vụ</span>
              </nav>
            </div>
            <div className="footer-links">
              <h4>Theo dõi chúng tôi</h4>
              <div className="social-icons">
                <span className="social-icon">📘</span>
                <span className="social-icon">📸</span>
                <span className="social-icon">TikTok</span>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            © 2026 Nghe Nghe Bakery. Tất cả quyền được bảo lưu.
          </div>
        </footer>
      </div>
      <Toaster position="top-center" />
    </BrowserRouter>
  )
}

export default App
