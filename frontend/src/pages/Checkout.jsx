import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { getCart } from '../api/cartAPI'
import { getAvailableSlots } from '../api/deliveryAPI'
import { createOrder } from '../api/orderAPI'
import { getErrorMessage, formatCurrency } from '../utils/helpers'

const defaultForm = {
  recipientName: '',
  phone: '',
  addressLine: '',
  district: '',
  province: '',
  deliveryDate: '',
  deliveryTime: 'Sáng (8h - 12h)',
  shippingMethod: 'Tiêu chuẩn',
  customNotes: '',
  couponCode: '',
}

export default function Checkout({ session }) {
  const navigate = useNavigate()
  const [cart, setCart] = useState({ items: [], subtotal: 0 })
  const [deliveryOptions, setDeliveryOptions] = useState({ availableDates: [], availableSlotsByDate: {} })
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCart = async () => {
      if (!session.token || session.user.id === 'guest-user') {
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

  useEffect(() => {
    const loadDeliveryOptions = async () => {
      if (!session.token || cart.items.length === 0) {
        setDeliveryOptions({ availableDates: [], availableSlotsByDate: {} })
        return
      }

      const uniqueProductIds = [...new Set(cart.items.map((item) => item.productId))]

      try {
        const responses = await Promise.all(uniqueProductIds.map((productId) => getAvailableSlots(productId)))
        const slotMaps = responses.map(({ data }) => data.availableSlotsByDate || {})
        const commonDates = slotMaps.length === 0
          ? []
          : Object.keys(slotMaps[0]).filter((date) =>
              slotMaps.every((slotMap) => Array.isArray(slotMap[date]) && slotMap[date].length > 0),
            )

        const commonSlotsByDate = commonDates.reduce((accumulator, date) => {
          const slotsForDate = slotMaps.reduce((currentSlots, slotMap, index) => {
            const nextSlots = slotMap[date] || []

            if (index === 0) {
              return [...nextSlots]
            }

            return currentSlots.filter((slot) => nextSlots.includes(slot))
          }, [])

          if (slotsForDate.length > 0) {
            accumulator[date] = slotsForDate
          }

          return accumulator
        }, {})

        const availableDates = commonDates.filter((date) => commonSlotsByDate[date]?.length > 0)
        setDeliveryOptions({ availableDates, availableSlotsByDate: commonSlotsByDate })
      } catch (error) {
        toast.error(getErrorMessage(error, 'Không thể tải lịch giao hàng'))
        setDeliveryOptions({ availableDates: [], availableSlotsByDate: {} })
      }
    }

    loadDeliveryOptions()
  }, [cart.items, session.token])

  useEffect(() => {
    if (deliveryOptions.availableDates.length === 0) {
      setForm((current) => ({ ...current, deliveryDate: '', deliveryTime: defaultForm.deliveryTime }))
      return
    }

    setForm((current) => {
      const nextDate = deliveryOptions.availableDates.includes(current.deliveryDate)
        ? current.deliveryDate
        : deliveryOptions.availableDates[0]
      const availableTimes = deliveryOptions.availableSlotsByDate[nextDate] || []
      const nextTime = availableTimes.includes(current.deliveryTime)
        ? current.deliveryTime
        : availableTimes[0] || defaultForm.deliveryTime

      return {
        ...current,
        deliveryDate: nextDate,
        deliveryTime: nextTime,
      }
    })
  }, [deliveryOptions])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => {
      if (name === 'deliveryDate') {
        const availableTimes = deliveryOptions.availableSlotsByDate[value] || []
        return {
          ...current,
          deliveryDate: value,
          deliveryTime: availableTimes.includes(current.deliveryTime)
            ? current.deliveryTime
            : availableTimes[0] || '',
        }
      }

      return { ...current, [name]: value }
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      const orderPayload = {
        shippingAddress: {
          recipientName: form.recipientName,
          phone: form.phone,
          addressLine: form.addressLine,
          district: form.district,
          province: form.province,
        },
        shippingMethod: form.shippingMethod === 'Hỏa tốc' ? 'express' : 'standard',
        deliveryDate: form.deliveryDate,
        deliveryTime: form.deliveryTime,
        customNotes: form.customNotes,
        couponCode: form.couponCode,
        paymentMethod: 'cod',
      }

      const { data: order } = await createOrder(orderPayload)
      
      toast.success('Đặt hàng thành công! Đơn hàng sẽ được thanh toán khi nhận bánh (COD).')
      navigate('/orders')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể tạo đơn hàng'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!session.token || session.user.id === 'guest-user') {
    return <div className="empty-card">Bạn cần đăng nhập để thực hiện thanh toán nhé.</div>
  }

  if (loading) {
    return <div className="empty-card">Đang chuẩn bị thông tin thanh toán...</div>
  }

  if (cart.items.length === 0) {
    return (
      <div className="empty-card">
        <h2>Giỏ hàng đang trống</h2>
        <p style={{ margin: '20px 0' }}>Bạn chưa có chiếc bánh nào để thanh toán cả.</p>
        <button type="button" className="primary-button" onClick={() => navigate('/catalog')}>Quay lại thực đơn</button>
      </div>
    )
  }

  const availableTimes = deliveryOptions.availableSlotsByDate[form.deliveryDate] || []

  return (
    <div className="checkout-page">
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
        <div className="step-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.5 }}>
          <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ccc', color: 'white', display: 'grid', placeItems: 'center' }}>2</span>
          <span>Giỏ hàng</span>
        </div>
        <div className="step-item active" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)', fontWeight: 700 }}>
          <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'grid', placeItems: 'center' }}>3</span>
          <span>Thanh toán</span>
        </div>
      </div>

      <div className="checkout-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '40px' }}>
        <form className="checkout-form" onSubmit={handleSubmit} style={{ background: 'white', padding: '40px', borderRadius: '32px', boxShadow: 'var(--shadow-premium)' }}>
          <header style={{ marginBottom: '32px' }}>
            <p className="eyebrow">Xác nhận đặt bánh</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>Thông tin giao hàng</h2>
          </header>

          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Tên người nhận *</label>
              <input name="recipientName" placeholder="VD: Nguyễn Văn A" value={form.recipientName} onChange={handleChange} required style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Số điện thoại *</label>
              <input name="phone" placeholder="VD: 0901234567" value={form.phone} onChange={handleChange} required style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)' }} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Địa chỉ chi tiết *</label>
              <input name="addressLine" placeholder="Số nhà, tên đường..." value={form.addressLine} onChange={handleChange} required style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Quận / Huyện</label>
              <input name="district" placeholder="VD: Quận 1" value={form.district} onChange={handleChange} style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Tỉnh / Thành phố</label>
              <input name="province" placeholder="VD: TP. Hồ Chí Minh" value={form.province} onChange={handleChange} style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Ngày nhận bánh *</label>
              <select name="deliveryDate" value={form.deliveryDate} onChange={handleChange} required disabled={deliveryOptions.availableDates.length === 0} style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)' }}>
                {deliveryOptions.availableDates.length === 0 ? (
                  <option value="">Không có lịch giao phù hợp</option>
                ) : (
                  deliveryOptions.availableDates.map((date) => (
                    <option key={date} value={date}>{date}</option>
                  ))
                )}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Thời gian nhận *</label>
              <select name="deliveryTime" value={form.deliveryTime} onChange={handleChange} style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)' }}>
                {availableTimes.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Phương thức vận chuyển</label>
              <select name="shippingMethod" value={form.shippingMethod} onChange={handleChange} style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)' }}>
                <option value="Tiêu chuẩn">Tiêu chuẩn (Giao trong ngày)</option>
                <option value="Hỏa tốc">Hỏa tốc (Đúng giờ hẹn + 50k)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Mã giảm giá (nếu có)</label>
              <input name="couponCode" placeholder="VD: GIAMGIA10" value={form.couponCode} onChange={handleChange} style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)' }} />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Ghi chú đặc biệt cho thợ bánh</label>
              <textarea
                name="customNotes"
                placeholder="VD: Viết chữ 'Chúc mừng sinh nhật', cắm thêm 2 nến hồng..."
                value={form.customNotes}
                onChange={handleChange}
                rows="3"
                style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)', resize: 'vertical' }}
              />
            </div>
          </div>

          <div style={{ background: 'var(--accent-light)', padding: '20px', borderRadius: '16px', marginBottom: '32px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem' }}>💵</span>
            <div>
              <div style={{ fontWeight: 700 }}>Thanh toán khi nhận hàng (COD)</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bạn chỉ cần trả tiền khi bánh đã được giao đến tận tay.</div>
            </div>
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={submitting || deliveryOptions.availableDates.length === 0 || availableTimes.length === 0}
            style={{ width: '100%', padding: '20px' }}
          >
            {submitting ? 'Đang gửi đơn hàng...' : 'Xác nhận Đặt hàng ngay'}
          </button>
          
          {deliveryOptions.availableDates.length === 0 && (
            <p style={{ color: '#e53e3e', fontSize: '0.85rem', marginTop: '16px', textAlign: 'center' }}>
              Rất tiếc, hiện tại không tìm thấy lịch giao hàng chung cho tất cả sản phẩm trong giỏ của bạn. Vui lòng liên hệ hotline để được hỗ trợ.
            </p>
          )}
        </form>

        <aside className="summary-card" style={{ background: 'white', padding: '30px', borderRadius: '32px', boxShadow: 'var(--shadow-premium)', height: 'fit-content', position: 'sticky', top: '120px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: '24px' }}>Tóm tắt đơn hàng</h3>
          <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
            {cart.items.map((item) => (
              <div key={item.variantId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{item.productName} x {item.quantity}</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Tạm tính:</span>
              <span>{formatCurrency(cart.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Phí vận chuyển:</span>
              <span>Miễn phí</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, marginTop: '10px' }}>
              <span>Tổng cộng:</span>
              <span style={{ color: 'var(--accent)' }}>{formatCurrency(cart.subtotal)}</span>
            </div>
          </div>
          <div style={{ marginTop: '30px', padding: '16px', background: 'var(--bg-main)', borderRadius: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <p>💡 Đơn hàng Hỏa tốc sẽ được chúng tôi gọi điện xác nhận và thông báo phụ phí cụ thể (thường là 50.000đ).</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
