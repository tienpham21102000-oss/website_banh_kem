import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getOrders } from '../api/orderAPI'
import { formatCurrency, getErrorMessage } from '../utils/helpers'

export default function OrderHistory({ session }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOrders = async () => {
    if (!session.token || session.user.id === 'guest-user') {
      setLoading(false)
      return
    }
    try {
      const { data } = await getOrders()
      setOrders(data.orders || [])
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể tải lịch sử đơn hàng'))
    } finally {
      setLoading(false)
    }
  }

    loadOrders()
  }, [session.token])

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Đang chờ duyệt',
      'processing': 'Đang thực hiện',
      'delivered': 'Đã giao hàng',
      'cancelled': 'Đã hủy',
      'paid': 'Đã thanh toán',
    }
    return statusMap[status] || status
  }

  if (!session.token || session.user.id === 'guest-user') {
    return (
      <div className="empty-card" style={{ marginTop: '40px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔒</div>
        <h2>Vui lòng đăng nhập</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>Bạn cần đăng nhập để xem lịch sử đặt bánh của mình.</p>
      </div>
    )
  }

  if (loading) {
    return <div className="empty-card">Đang tải lịch sử đơn hàng...</div>
  }

  return (
    <div className="order-history-page">
      <header style={{ marginBottom: '60px', textAlign: 'center' }}>
        <p className="eyebrow">Hành trình ngọt ngào</p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem' }}>Lịch sử đơn hàng của bạn</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>Theo dõi trạng thái và chi tiết các đơn hàng bạn đã đặt tại Nghe Nghe Bakery.</p>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gap: '30px' }}>
        {orders.length === 0 ? (
          <div className="empty-card" style={{ padding: '80px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📜</div>
            <h2>Chưa có đơn hàng nào</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>Bắt đầu hành trình ngọt ngào của bạn bằng cách chọn một chiếc bánh thật ngon nhé!</p>
          </div>
        ) : (
          orders.map((order) => (
            <article key={order.id} style={{ 
              background: 'white', 
              padding: '32px', 
              borderRadius: '32px', 
              boxShadow: 'var(--shadow-premium)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '24px', 
                paddingBottom: '20px',
                borderBottom: '1px solid var(--border-subtle)' 
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'var(--font-heading)' }}>Đơn hàng #{order.order_number}</h3>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '99px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: order.status === 'pending' ? '#fff3cd' : '#d1e7dd',
                      color: order.status === 'pending' ? '#856404' : '#0f5132'
                    }}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <p style={{ marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Đặt lúc: {new Date(order.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent)' }}>{formatCurrency(order.total_amount)}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Thanh toán COD</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-dark)' }}>📍 Thông tin giao hàng</p>
                  <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-muted)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{order.shipping_address?.recipientName}</div>
                    <div>{order.shipping_address?.phone}</div>
                    <div>{order.shipping_address?.addressLine}, {order.shipping_address?.district}, {order.shipping_address?.province}</div>
                  </div>
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-dark)' }}>⏰ Lịch hẹn giao bánh</p>
                  <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-muted)' }}>
                    <div>Ngày nhận: <strong style={{ color: 'var(--text-dark)' }}>{order.requested_delivery_date}</strong></div>
                    <div>Khung giờ: <strong style={{ color: 'var(--text-dark)' }}>{order.requested_delivery_time}</strong></div>
                    <div>Phương thức: <span style={{ textTransform: 'capitalize' }}>{order.shipping_method === 'express' ? 'Hỏa tốc' : 'Tiêu chuẩn'}</span></div>
                  </div>
                </div>
              </div>

              {order.custom_notes && (
                <div style={{ 
                  marginTop: '24px', 
                  padding: '16px', 
                  background: 'var(--bg-main)', 
                  borderRadius: '16px', 
                  fontSize: '0.9rem',
                  borderLeft: '4px solid var(--accent)'
                }}>
                  <strong>Ghi chú:</strong> {order.custom_notes}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  )
}
