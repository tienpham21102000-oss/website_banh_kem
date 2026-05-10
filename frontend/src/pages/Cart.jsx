import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { clearCart, getCart, removeFromCart, updateCartItemQuantity } from '../api/cartAPI'
import { formatCurrency, getErrorMessage } from '../utils/helpers'

export default function Cart({ session }) {
  const [cart, setCart] = useState({ items: [], subtotal: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [pendingVariantId, setPendingVariantId] = useState(null)

  useEffect(() => {
    const loadCart = async () => {
      if (!session.token) {
        setCart({ items: [], subtotal: 0, total: 0 })
        setLoading(false)
        return
      }

      try {
        const { data } = await getCart()
        setCart(data)
      } catch (error) {
        toast.error(getErrorMessage(error, 'Không thể tải giỏ hàng'))
      } finally {
        setLoading(false)
      }
    }

    loadCart()
  }, [session.token])

  const handleQuantityChange = async (variantId, quantity) => {
    if (quantity <= 0) return handleRemove(variantId)
    setPendingVariantId(variantId)

    try {
      const { data } = await updateCartItemQuantity(variantId, quantity)
      setCart(data)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể cập nhật số lượng'))
    } finally {
      setPendingVariantId(null)
    }
  }

  const handleRemove = async (variantId) => {
    setPendingVariantId(variantId)

    try {
      const { data } = await removeFromCart(variantId)
      setCart(data)
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể xóa sản phẩm'))
    } finally {
      setPendingVariantId(null)
    }
  }

  const handleClearCart = async () => {
    try {
      const { data } = await clearCart()
      setCart(data)
      toast.success('Đã làm trống giỏ hàng')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể xóa giỏ hàng'))
    }
  }

  if (!session.token || session.user.id === 'guest-user') {
    return (
      <div className="empty-card" style={{ marginTop: '40px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔒</div>
        <h2>Vui lòng đăng nhập</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>Bạn cần đăng nhập để xem và quản lý giỏ hàng của mình.</p>
      </div>
    )
  }

  if (loading) {
    return <div className="empty-card">Đang tải giỏ hàng của bạn...</div>
  }

  return (
    <div className="cart-page">
      <div className="step-indicator" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '40px', 
        marginBottom: '60px',
        padding: '20px',
        background: 'rgba(255, 255, 255, 0.5)',
        borderRadius: '24px'
      }}>
        <div className="step-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.5 }}>
          <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ccc', color: 'white', display: 'grid', placeItems: 'center' }}>1</span>
          <span>Chọn bánh</span>
        </div>
        <div className="step-item active" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)', fontWeight: 700 }}>
          <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'grid', placeItems: 'center' }}>2</span>
          <span>Giỏ hàng</span>
        </div>
        <div className="step-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.5 }}>
          <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ccc', color: 'white', display: 'grid', placeItems: 'center' }}>3</span>
          <span>Thanh toán</span>
        </div>
      </div>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <p className="eyebrow">Túi hàng của bạn</p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem' }}>Chi tiết giỏ hàng</h2>
        </div>
        {cart.items.length > 0 && (
          <button type="button" className="ghost-button" onClick={handleClearCart} style={{ color: '#e53e3e' }}>
            🗑️ Xóa toàn bộ
          </button>
        )}
      </header>

      {cart.items.length === 0 ? (
        <div className="empty-card" style={{ padding: '100px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🛒</div>
          <h2>Giỏ hàng đang trống</h2>
          <p style={{ color: 'var(--text-muted)', margin: '20px 0 40px' }}>Hãy quay lại thực đơn để chọn những chiếc bánh thật ngon nhé!</p>
          <Link to="/catalog" className="primary-button" style={{ padding: '16px 40px', textDecoration: 'none' }}>
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <div className="cart-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '40px' }}>
          <div className="cart-items" style={{ display: 'grid', gap: '20px' }}>
            {cart.items.map((item) => (
              <article key={item.variantId} className="cart-item-card" style={{ 
                background: 'white', 
                padding: '24px', 
                borderRadius: '24px', 
                display: 'flex', 
                gap: '24px',
                boxShadow: 'var(--shadow-premium)',
                alignItems: 'center'
              }}>
                <div style={{ width: '120px', height: '120px', background: '#f5f5f5', borderRadius: '16px', overflow: 'hidden' }}>
                  <img src={item.productImage || 'https://via.placeholder.com/120'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flexGrow: 1 }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{item.productName}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '15px' }}>
                    <span>Size: <strong>{item.size}</strong></span>
                    <span>Hương vị: <strong>{item.topping}</strong></span>
                  </div>
                  <div style={{ marginTop: '12px', fontWeight: 700, color: 'var(--accent)' }}>
                    {formatCurrency(item.unitPrice)}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-main)', borderRadius: '12px', padding: '4px' }}>
                    <button
                      type="button"
                      className="ghost-button"
                      disabled={pendingVariantId === item.variantId}
                      onClick={() => handleQuantityChange(item.variantId, item.quantity - 1)}
                      style={{ padding: '8px 12px' }}
                    >
                      -
                    </button>
                    <span style={{ width: '40px', textAlign: 'center', fontWeight: 700 }}>{item.quantity}</span>
                    <button
                      type="button"
                      className="ghost-button"
                      disabled={pendingVariantId === item.variantId}
                      onClick={() => handleQuantityChange(item.variantId, item.quantity + 1)}
                      style={{ padding: '8px 12px' }}
                    >
                      +
                    </button>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                    {formatCurrency(item.subtotal)}
                  </div>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => handleRemove(item.variantId)}
                    style={{ color: '#e53e3e', fontSize: '0.8rem' }}
                  >
                    Loại bỏ
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="summary-card" style={{ 
            background: 'white', 
            padding: '30px', 
            borderRadius: '32px', 
            boxShadow: 'var(--shadow-premium)',
            height: 'fit-content',
            position: 'sticky',
            top: '120px'
          }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '24px' }}>Tổng đơn hàng</h3>
            <div style={{ display: 'grid', gap: '16px', marginBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Số mặt hàng:</span>
                <span>{cart.items.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Tạm tính:</span>
                <span>{formatCurrency(cart.subtotal)}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                paddingTop: '16px', 
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '1.2rem',
                fontWeight: 800
              }}>
                <span>Tổng cộng:</span>
                <span style={{ color: 'var(--accent)' }}>{formatCurrency(cart.subtotal)}</span>
              </div>
            </div>
            <Link to="/checkout" className="primary-button" style={{ 
              display: 'block', 
              textAlign: 'center', 
              textDecoration: 'none',
              padding: '18px'
            }}>
              Tiến hành thanh toán ➔
            </Link>
            <Link to="/catalog" style={{ 
              display: 'block', 
              textAlign: 'center', 
              marginTop: '20px', 
              fontSize: '0.9rem', 
              color: 'var(--text-muted)',
              textDecoration: 'none'
            }}>
              ← Tiếp tục chọn bánh
            </Link>
          </aside>
        </div>
      )}
    </div>
  )
}
