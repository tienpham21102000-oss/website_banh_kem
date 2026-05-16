import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  createAdminCoupon,
  createAdminProduct,
  createAdminVariant,
  deleteAdminVariant,
  getAdminCategories,
  getAdminCoupons,
  getAdminOrder,
  getAdminOrders,
  getAdminProducts,
  updateAdminCoupon,
  updateAdminOrderStatus,
  updateAdminProduct,
  updateAdminVariant,
  getAdminStats,
  deleteAdminCoupon,
} from '../api/adminAPI'
import { formatCurrency, getErrorMessage } from '../utils/helpers'

/* ─── Constants ─────────────────────────────────────────── */
const productFormDefaults = {
  sku: '', name: '', description: '', categoryId: '',
  basePrice: '', minAdvanceHours: '48', imageUrl: '',
}
const couponFormDefaults = {
  code: '', discountType: 'percentage', discountValue: '',
  maxUses: '', minOrderAmount: '', validFrom: '', validUntil: '',
}
const orderStatuses = [
  { value: 'pending',    label: 'Chờ duyệt',     color: '#f59e0b', bg: '#fef3c7' },
  { value: 'confirmed',  label: 'Đã xác nhận',   color: '#3b82f6', bg: '#dbeafe' },
  { value: 'paid',       label: 'Đã thanh toán', color: '#8b5cf6', bg: '#ede9fe' },
  { value: 'processing', label: 'Đang chuẩn bị', color: '#06b6d4', bg: '#cffafe' },
  { value: 'shipped',    label: 'Đang giao',      color: '#f97316', bg: '#ffedd5' },
  { value: 'delivered',  label: 'Đã giao',        color: '#10b981', bg: '#d1fae5' },
  { value: 'cancelled',  label: 'Đã hủy',         color: '#ef4444', bg: '#fee2e2' },
  { value: 'refunded',   label: 'Hoàn tiền',      color: '#6b7280', bg: '#f3f4f6' },
]
const getStatus = (v) => orderStatuses.find((s) => s.value === v) || orderStatuses[0]

/* ─── Micro Components ──────────────────────────────────── */
function StatusBadge({ value, large = false }) {
  const s = getStatus(value)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: s.bg, color: s.color,
      padding: large ? '6px 14px' : '4px 10px',
      borderRadius: '999px',
      fontSize: large ? '0.85rem' : '0.75rem',
      fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div style={{
      background: 'white', padding: '28px 30px', borderRadius: '24px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
      borderTop: `4px solid ${color}`,
      display: 'flex', flexDirection: 'column', gap: '8px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        <span style={{ fontSize: '1.4rem' }}>{icon}</span>
      </div>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{value}</h3>
      {sub && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}

function SectionCard({ title, action, children, noPad = false }) {
  return (
    <div style={{ background: 'white', borderRadius: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      {title && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '24px 30px', borderBottom: '1px solid #f1f5f9',
        }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>{title}</h3>
          {action}
        </div>
      )}
      <div style={noPad ? {} : { padding: '24px 30px' }}>{children}</div>
    </div>
  )
}

function InputField({ label, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </label>
      )}
      <input
        {...props}
        style={{
          padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #e2e8f0',
          fontFamily: 'inherit', fontSize: '0.9rem', background: '#fafafa',
          transition: 'border-color 0.2s', outline: 'none',
          ...props.style,
        }}
        onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; props.onFocus?.(e) }}
        onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; props.onBlur?.(e) }}
      />
    </div>
  )
}

/* ─── Facebook Info Card ────────────────────────────────── */
function FbInfoCard({ order }) {
  const meta = order.customer_meta
  const fbUserId = order.fb_user_id
  if (!meta && !fbUserId) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, #e8f0fe 0%, #f0f4ff 100%)',
      border: '1px solid #c7d8fd', borderRadius: '16px', padding: '18px 20px', marginTop: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {meta?.picture ? (
            <img src={meta.picture} alt="" style={{ width: '56px', height: '56px', borderRadius: '50%', border: '3px solid white', boxShadow: '0 4px 12px rgba(24,119,242,0.2)' }} />
          ) : (
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#1877F2', display: 'grid', placeItems: 'center', fontSize: '1.5rem', color: 'white', fontWeight: 800 }}>
              {(order.customer_name || 'K')[0].toUpperCase()}
            </div>
          )}
          <span style={{ position: 'absolute', bottom: 0, right: 0, background: '#1877F2', borderRadius: '50%', width: '18px', height: '18px', display: 'grid', placeItems: 'center', border: '2px solid white' }}>
            <svg viewBox="0 0 24 24" width="10" height="10" fill="white">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </span>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {meta?.firstName && meta?.lastName ? `${meta.firstName} ${meta.lastName}` : order.customer_name}
            </span>
            <span style={{ fontSize: '0.7rem', background: '#1877F2', color: 'white', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
              Facebook
            </span>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '6px', flexWrap: 'wrap' }}>
            {meta?.gender && (
              <span style={{ fontSize: '0.8rem', color: '#4b5563' }}>
                {meta.gender === 'male' ? '👨 Nam' : meta.gender === 'female' ? '👩 Nữ' : `🧑 ${meta.gender}`}
              </span>
            )}
            {meta?.locale && <span style={{ fontSize: '0.8rem', color: '#4b5563' }}>🌐 {meta.locale}</span>}
          </div>
        </div>

        {/* View Profile */}
        {fbUserId && (
          <a
            href={`https://facebook.com/${fbUserId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flexShrink: 0, background: '#1877F2', color: 'white',
              padding: '8px 14px', borderRadius: '10px', fontSize: '0.78rem',
              fontWeight: 700, textDecoration: 'none', display: 'flex',
              alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            Xem FB ↗
          </a>
        )}
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{icon} {label}</span>
      <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

/* ─── Order Detail Modal ─────────────────────────────────── */
function OrderModal({ order, onClose, onStatusChange }) {
  const [localStatus, setLocalStatus] = useState(order.status)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (localStatus === order.status) return
    setSaving(true)
    try {
      await onStatusChange(order.id, localStatus)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const addr = order.shipping_address || {}

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'white', borderRadius: '28px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.25)' }}
      >
        {/* Modal Header */}
        <div style={{ padding: '28px 32px 20px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'white', zIndex: 1, borderRadius: '28px 28px 0 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Chi tiết đơn hàng</p>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800 }}>#{order.order_number}</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {new Date(order.created_at).toLocaleString('vi-VN', { dateStyle: 'full', timeStyle: 'short' })}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <StatusBadge value={order.status} large />
              <button onClick={onClose} style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '1.1rem', display: 'grid', placeItems: 'center', color: '#94a3b8' }}>✕</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Customer */}
          <div style={{ background: '#f8fafc', borderRadius: '18px', padding: '20px' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '10px' }}>👤 Khách hàng</p>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--accent)', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>
                {(order.customer_name || 'K')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{order.customer_name || 'Khách hàng'}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{order.customer_email}</div>
              </div>
            </div>
            <FbInfoCard order={order} />
          </div>

          {/* Shipping */}
          <div style={{ background: '#f8fafc', borderRadius: '18px', padding: '20px' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '14px' }}>📦 Thông tin giao hàng</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.88rem' }}>
              <InfoRow icon="👤" label="Người nhận" value={addr.recipientName || '—'} />
              <InfoRow icon="📱" label="Điện thoại" value={addr.phone || '—'} />
              <div style={{ gridColumn: '1/-1' }}>
                <InfoRow icon="📍" label="Địa chỉ" value={[addr.addressLine, addr.district, addr.province].filter(Boolean).join(', ') || '—'} />
              </div>
              {order.requested_delivery_date && (
                <InfoRow icon="📅" label="Ngày giao" value={`${order.requested_delivery_date}${order.requested_delivery_time ? ' — ' + order.requested_delivery_time : ''}`} />
              )}
              {order.shipping_method && (
                <InfoRow icon="🚚" label="Vận chuyển" value={order.shipping_method === 'express' ? 'Hỏa tốc' : 'Tiêu chuẩn'} />
              )}
            </div>
            {order.custom_notes && (
              <div style={{ marginTop: '12px', padding: '12px', background: '#fff9e6', borderRadius: '10px', fontSize: '0.85rem', borderLeft: '3px solid #f59e0b' }}>
                <strong>📝 Ghi chú:</strong> {order.custom_notes}
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '12px' }}>🍰 Sản phẩm đặt</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {!(order.items?.length) ? (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>Không có dữ liệu sản phẩm</div>
              ) : order.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', border: '1.5px solid #f1f5f9', borderRadius: '14px', background: 'white' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{item.product_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                      {[item.size, item.topping, item.color].filter(Boolean).join(' · ')}
                      <span style={{ margin: '0 6px', color: '#cbd5e1' }}>×</span>
                      <strong>{item.quantity}</strong>
                    </div>
                  </div>
                  <strong style={{ color: 'var(--accent)', fontSize: '0.95rem' }}>{formatCurrency(item.subtotal)}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {order.discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#10b981' }}>
                <span>🎫 Giảm giá{order.coupon_code ? ` (${order.coupon_code})` : ''}</span>
                <span>- {formatCurrency(order.discount_amount)}</span>
              </div>
            )}
            {order.shipping_fee > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                <span>🚚 Phí vận chuyển</span>
                <span>{formatCurrency(order.shipping_fee)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.2rem', marginTop: '6px' }}>
              <span>Tổng cộng</span>
              <span style={{ color: 'var(--accent)' }}>{formatCurrency(order.total_amount)}</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'right' }}>
              {order.payment_method === 'cod' ? '💵 COD (thu khi giao)' : `💳 ${order.payment_method}`}
            </div>
          </div>

          {/* Status Update */}
          <div style={{ background: '#f8fafc', borderRadius: '18px', padding: '20px', display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '8px' }}>⚙️ Cập nhật trạng thái</p>
              <select
                value={localStatus}
                onChange={(e) => setLocalStatus(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.9rem', background: 'white', cursor: 'pointer' }}
              >
                {orderStatuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || localStatus === order.status}
              style={{
                padding: '10px 24px', borderRadius: '12px', border: 'none',
                background: localStatus === order.status ? '#e2e8f0' : 'var(--text-dark)',
                color: localStatus === order.status ? 'var(--text-muted)' : 'white',
                fontWeight: 700, fontSize: '0.9rem',
                cursor: localStatus === order.status ? 'default' : 'pointer',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────── */
export default function AdminDashboard({ session, adminEmail }) {
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', search: '' })
  const [productForm, setProductForm] = useState(productFormDefaults)
  const [couponForm, setCouponForm] = useState(couponFormDefaults)
  const [variantForms, setVariantForms] = useState({})
  const [editingProductId, setEditingProductId] = useState(null)
  const [savingProduct, setSavingProduct] = useState(false)
  const [savingCoupon, setSavingCoupon] = useState(false)
  const [savingVariantForProductId, setSavingVariantForProductId] = useState(null)
  const [updatingProductId, setUpdatingProductId] = useState(null)
  const [updatingCouponId, setUpdatingCouponId] = useState(null)
  const [deletingVariantId, setDeletingVariantId] = useState(null)
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, pendingOrders: 0, todayRevenue: 0 })
  const [activeTab, setActiveTab] = useState('stats')

  const canAccess = session.user?.email === adminEmail

  const loadAdminData = async (overrideStatus) => {
    setLoading(true)
    const currentStatus = overrideStatus !== undefined ? overrideStatus : filters.status
    try {
      const [
        { data: orderData }, { data: categoryData },
        { data: productData }, { data: couponData }, { data: statsData },
      ] = await Promise.all([
        getAdminOrders({ status: currentStatus, search: filters.search }),
        getAdminCategories(), getAdminProducts(), getAdminCoupons(), getAdminStats(),
      ])
      setOrders(orderData.orders || [])
      setCategories(categoryData.categories || [])
      setProducts(productData.products || [])
      setCoupons(couponData.coupons || [])
      setStats(statsData)
      setProductForm((c) => ({ ...c, categoryId: c.categoryId || categoryData.categories?.[0]?.id || '' }))
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể tải dữ liệu admin'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (canAccess) loadAdminData() }, [canAccess])

  const handleFilterStatus = async (value) => {
    setFilters((c) => ({ ...c, status: value }))
    await loadAdminData(value)
  }

  const handleExportCSV = () => {
    if (!orders.length) { toast.error('Không có dữ liệu để xuất'); return }
    const headers = ['Mã đơn', 'Khách hàng', 'SĐT', 'Tổng tiền', 'Trạng thái', 'Ngày đặt']
    const rows = orders.map((o) => [
      o.order_number,
      o.shipping_address?.recipientName || 'Khách',
      o.shipping_address?.phone || '',
      o.total_amount,
      o.status,
      new Date(o.created_at).toLocaleString('vi-VN'),
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `don_hang_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('Đã tải file CSV')
  }

  const handleSelectOrder = async (orderId) => {
    try {
      const { data } = await getAdminOrder(orderId)
      setSelectedOrder(data)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể tải chi tiết đơn hàng'))
    }
  }

  const handleOrderStatusChange = async (orderId, status) => {
    try {
      const { data } = await updateAdminOrderStatus(orderId, status)
      setOrders((c) => c.map((o) => o.id === orderId ? { ...o, status: data.status } : o))
      toast.success('Đã cập nhật trạng thái')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể cập nhật trạng thái'))
      throw error
    }
  }

  /* ── Product ── */
  const handleProductFieldChange = (e) => setProductForm((c) => ({ ...c, [e.target.name]: e.target.value }))
  const handleInlineProductChange = (id, field, value) => setProducts((c) => c.map((p) => p.id === id ? { ...p, [field]: value } : p))

  const handleCreateProduct = async (e) => {
    e.preventDefault(); setSavingProduct(true)
    try {
      await createAdminProduct({ ...productForm, basePrice: Number(productForm.basePrice), minAdvanceHours: Number(productForm.minAdvanceHours) })
      await loadAdminData()
      setProductForm({ ...productFormDefaults, categoryId: categories[0]?.id || '' })
      toast.success('Đã tạo sản phẩm')
    } catch (error) { toast.error(getErrorMessage(error, 'Không thể tạo sản phẩm')) }
    finally { setSavingProduct(false) }
  }

  const handleSaveProduct = async (product) => {
    setUpdatingProductId(product.id)
    try {
      const { data } = await updateAdminProduct(product.id, {
        sku: product.sku, name: product.name, description: product.description || '',
        categoryId: product.category_id, basePrice: Number(product.base_price),
        minAdvanceHours: Number(product.min_advance_hours), imageUrl: product.image_url || '', status: product.status,
      })
      setProducts((c) => c.map((p) => p.id === product.id ? data : p))
      setEditingProductId(null)
      toast.success('Đã lưu sản phẩm')
    } catch (error) { toast.error(getErrorMessage(error, 'Không thể lưu')) }
    finally { setUpdatingProductId(null) }
  }

  /* ── Coupon ── */
  const handleCouponFieldChange = (e) => setCouponForm((c) => ({ ...c, [e.target.name]: e.target.value }))

  const handleCreateCoupon = async (e) => {
    e.preventDefault(); setSavingCoupon(true)
    try {
      await createAdminCoupon({
        ...couponForm,
        discountValue: Number(couponForm.discountValue),
        maxUses: couponForm.maxUses ? Number(couponForm.maxUses) : null,
        minOrderAmount: couponForm.minOrderAmount ? Number(couponForm.minOrderAmount) : 0,
      })
      await loadAdminData(); setCouponForm(couponFormDefaults)
      toast.success('Đã tạo mã giảm giá')
    } catch (error) { toast.error(getErrorMessage(error, 'Không thể tạo mã')) }
    finally { setSavingCoupon(false) }
  }

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Xóa mã giảm giá này?')) return
    try {
      await deleteAdminCoupon(id)
      setCoupons((c) => c.filter((item) => item.id !== id))
      toast.success('Đã xóa mã')
    } catch (error) { toast.error(getErrorMessage(error, 'Không thể xóa')) }
  }

  /* ── Variant ── */
  const handleVariantFieldChange = (productId, field, value) =>
    setVariantForms((c) => ({
      ...c,
      [productId]: { variantSku: '', size: '', topping: '', color: '', stockQuantity: '', priceAdjustment: '', ...(c[productId] || {}), [field]: value },
    }))

  const handleCreateVariant = async (productId) => {
    const form = variantForms[productId] || {}; setSavingVariantForProductId(productId)
    try {
      await createAdminVariant(productId, {
        variantSku: form.variantSku, size: form.size, topping: form.topping, color: form.color,
        stockQuantity: Number(form.stockQuantity || 0), priceAdjustment: Number(form.priceAdjustment || 0),
      })
      await loadAdminData()
      setVariantForms((c) => ({ ...c, [productId]: { variantSku: '', size: '', topping: '', color: '', stockQuantity: '', priceAdjustment: '' } }))
      toast.success('Đã thêm biến thể')
    } catch (error) { toast.error(getErrorMessage(error, 'Không thể tạo biến thể')) }
    finally { setSavingVariantForProductId(null) }
  }

  const handleDeleteVariant = async (productId, variantId) => {
    if (!window.confirm('Xóa biến thể này?')) return; setDeletingVariantId(variantId)
    try {
      await deleteAdminVariant(variantId)
      setProducts((c) => c.map((p) => p.id !== productId ? p : { ...p, variants: (p.variants || []).filter((v) => v.id !== variantId) }))
      toast.success('Đã xóa biến thể')
    } catch (error) { toast.error(getErrorMessage(error, 'Không thể xóa')) }
    finally { setDeletingVariantId(null) }
  }

  /* ─── Guard ─────────────────────────────────────────────── */
  if (!session.token || !canAccess) {
    return (
      <div style={{ minHeight: '80vh', display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '28px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', maxWidth: '400px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>🔐</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', marginBottom: '10px' }}>Khu vực Admin</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>Vui lòng đăng nhập bằng tài khoản quản trị viên để tiếp tục.</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'stats',    label: 'Tổng quan',   icon: '📊' },
    { id: 'orders',   label: 'Đơn hàng',    icon: '📦', badge: stats.pendingOrders || null },
    { id: 'products', label: 'Sản phẩm',    icon: '🍰' },
    { id: 'variants', label: 'Biến thể',    icon: '🛠️' },
    { id: 'coupons',  label: 'Mã giảm giá', icon: '🎫' },
  ]

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Top Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0 16px' }}>
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: '2px' }}>Quản trị hệ thống</p>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800 }}>Bảng điều khiển Admin</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Nghe Nghe Admin</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{adminEmail}</div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent)', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 800, fontSize: '1rem' }}>A</div>
            </div>
          </div>

          {/* Tab Nav */}
          <div style={{ display: 'flex', gap: '2px' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '13px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '7px',
                  borderBottom: activeTab === tab.id ? '2.5px solid var(--accent)' : '2.5px solid transparent',
                  color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {tab.badge ? (
                  <span style={{ background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 800, padding: '1px 6px', borderRadius: '999px', minWidth: '18px', textAlign: 'center' }}>{tab.badge}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 40px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            {/* ── STATS ── */}
            {activeTab === 'stats' && (
              <div style={{ display: 'grid', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                  <StatCard label="Tổng doanh thu" value={formatCurrency(stats.totalRevenue)} icon="💰" color="#3b82f6" sub="Tính từ khi bắt đầu" />
                  <StatCard label="Doanh thu hôm nay" value={formatCurrency(stats.todayRevenue)} icon="📈" color="#10b981" sub={new Date().toLocaleDateString('vi-VN')} />
                  <StatCard label="Tổng đơn hàng" value={stats.totalOrders} icon="📦" color="#f59e0b" sub="Tất cả trạng thái" />
                  <StatCard label="Đơn chờ xử lý" value={stats.pendingOrders} icon="⏳" color="#ef4444" sub="Cần xem xét ngay" />
                </div>
                <SectionCard title="📋 Đơn hàng gần đây">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {orders.slice(0, 6).map((o) => (
                      <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <StatusBadge value={o.status} />
                          <div>
                            <span style={{ fontWeight: 700 }}>#{o.order_number}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: '10px' }}>{o.shipping_address?.recipientName || 'Khách'}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <strong style={{ color: 'var(--accent)' }}>{formatCurrency(o.total_amount)}</strong>
                          <button className="ghost-button" style={{ fontSize: '0.8rem' }} onClick={() => handleSelectOrder(o.id)}>Chi tiết →</button>
                        </div>
                      </div>
                    ))}
                    {orders.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Chưa có đơn hàng nào</p>}
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ── ORDERS ── */}
            {activeTab === 'orders' && (
              <SectionCard
                title={`📦 Đơn hàng (${orders.length})`}
                action={
                  <button type="button" onClick={handleExportCSV} style={{ background: '#10b981', color: 'white', border: 'none', padding: '9px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                    ↓ Xuất CSV
                  </button>
                }
              >
                {/* Filters */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <input
                    type="text" placeholder="🔍  Tìm theo mã đơn..."
                    value={filters.search}
                    onChange={(e) => setFilters((c) => ({ ...c, search: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && loadAdminData()}
                    style={{ padding: '10px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', flexGrow: 1, fontFamily: 'inherit', fontSize: '0.9rem', minWidth: '200px', outline: 'none' }}
                  />
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterStatus(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.9rem', background: 'white', cursor: 'pointer' }}
                  >
                    <option value="">Tất cả trạng thái</option>
                    {orderStatuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <button type="button" onClick={() => loadAdminData()} style={{ padding: '10px 20px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: 'white', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                    Làm mới
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
                    <p>Không tìm thấy đơn hàng nào</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', border: '1.5px solid #e8edf2', borderRadius: '16px', background: 'white', transition: 'box-shadow 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none' }}
                      >
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                          <StatusBadge value={order.status} />
                          <div>
                            <div style={{ fontWeight: 700 }}>#{order.order_number}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {order.shipping_address?.recipientName || 'Khách'} · {new Date(order.created_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <strong style={{ color: 'var(--accent)', fontSize: '1rem' }}>{formatCurrency(order.total_amount)}</strong>
                          <select
                            value={order.status}
                            onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                            style={{ padding: '7px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.82rem', fontFamily: 'inherit', background: 'white', cursor: 'pointer' }}
                          >
                            {orderStatuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                          <button className="ghost-button" onClick={() => handleSelectOrder(order.id)} style={{ fontSize: '0.82rem', padding: '7px 14px' }}>
                            Chi tiết →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            )}

            {/* ── PRODUCTS ── */}
            {activeTab === 'products' && (
              <div style={{ display: 'grid', gap: '24px' }}>
                <SectionCard title="➕ Thêm sản phẩm mới">
                  <form onSubmit={handleCreateProduct}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                      <InputField label="Mã SKU" name="sku" placeholder="VD: CAKE-001" value={productForm.sku} onChange={handleProductFieldChange} required />
                      <InputField label="Tên bánh" name="name" placeholder="Tên sản phẩm" value={productForm.name} onChange={handleProductFieldChange} required />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Danh mục</label>
                        <select name="categoryId" value={productForm.categoryId} onChange={handleProductFieldChange} required style={{ padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.9rem', background: '#fafafa', outline: 'none' }}>
                          <option value="">Chọn danh mục</option>
                          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <InputField label="Giá cơ bản (VNĐ)" name="basePrice" type="number" placeholder="0" value={productForm.basePrice} onChange={handleProductFieldChange} required />
                      <InputField label="Giờ đặt trước tối thiểu" name="minAdvanceHours" type="number" placeholder="48" value={productForm.minAdvanceHours} onChange={handleProductFieldChange} />
                      <InputField label="URL ảnh" name="imageUrl" placeholder="https://..." value={productForm.imageUrl} onChange={handleProductFieldChange} />
                    </div>
                    <textarea
                      name="description" placeholder="Mô tả sản phẩm..." value={productForm.description} onChange={handleProductFieldChange} rows="3"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.9rem', resize: 'vertical', marginBottom: '16px', background: '#fafafa', outline: 'none' }}
                    />
                    <button type="submit" disabled={savingProduct} style={{ padding: '13px 32px', borderRadius: '12px', border: 'none', background: 'var(--text-dark)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                      {savingProduct ? 'Đang lưu...' : '💾 Lưu sản phẩm'}
                    </button>
                  </form>
                </SectionCard>

                <SectionCard title={`🍰 Danh sách sản phẩm (${products.length})`} noPad>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', padding: '24px 30px' }}>
                    {products.map((p) => (
                      <div
                        key={p.id}
                        style={{ border: '1.5px solid #e8edf2', borderRadius: '20px', overflow: 'hidden', background: 'white', transition: 'box-shadow 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none' }}
                      >
                        <div style={{ height: '150px', overflow: 'hidden', background: '#f8fafc' }}>
                          {p.image_url
                            ? <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: '3rem' }}>🎂</div>
                          }
                        </div>
                        <div style={{ padding: '16px' }}>
                          <div style={{ fontWeight: 700, marginBottom: '2px' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px' }}>SKU: {p.sku} · {p.variants?.length || 0} biến thể</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: 'var(--accent)' }}>{formatCurrency(p.base_price)}</strong>
                            <button className="ghost-button" style={{ fontSize: '0.78rem', padding: '6px 12px' }} onClick={() => setEditingProductId(editingProductId === p.id ? null : p.id)}>
                              {editingProductId === p.id ? 'Đóng' : 'Sửa'}
                            </button>
                          </div>
                          {editingProductId === p.id && (
                            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <input value={p.name} onChange={(e) => handleInlineProductChange(p.id, 'name', e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} placeholder="Tên sản phẩm" />
                              <input value={p.base_price} type="number" onChange={(e) => handleInlineProductChange(p.id, 'base_price', e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} placeholder="Giá cơ bản" />
                              <button onClick={() => handleSaveProduct(p)} disabled={updatingProductId === p.id} style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'var(--text-dark)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>
                                {updatingProductId === p.id ? 'Đang lưu...' : '💾 Lưu thay đổi'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ── VARIANTS ── */}
            {activeTab === 'variants' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {products.map((p) => (
                  <SectionCard key={p.id} title={`${p.name} — ${p.variants?.length || 0} biến thể`}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                      {(p.variants || []).length === 0 && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontStyle: 'italic' }}>Chưa có biến thể nào.</p>
                      )}
                      {(p.variants || []).map((v) => (
                        <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', fontSize: '0.88rem' }}>
                          <div style={{ display: 'flex', gap: '16px' }}>
                            {v.size && <span>📏 <strong>{v.size}</strong></span>}
                            {v.topping && <span>🍫 <strong>{v.topping}</strong></span>}
                            {v.color && <span>🎨 <strong>{v.color}</strong></span>}
                            <span style={{ color: 'var(--text-muted)' }}>Kho: <strong>{v.stock_quantity}</strong></span>
                          </div>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <strong style={{ color: 'var(--accent)' }}>+{formatCurrency(v.price_adjustment)}</strong>
                            <button className="ghost-button" style={{ color: '#ef4444', fontSize: '0.78rem', padding: '5px 10px' }} onClick={() => handleDeleteVariant(p.id, v.id)} disabled={deletingVariantId === v.id}>
                              {deletingVariantId === v.id ? '...' : 'Xóa'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: '#f0f9ff', borderRadius: '14px', padding: '16px', border: '1.5px dashed #bae6fd' }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', marginBottom: '10px', textTransform: 'uppercase' }}>+ Thêm biến thể mới</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: '10px', alignItems: 'flex-end' }}>
                        <InputField label="Size" placeholder="VD: 16cm" value={variantForms[p.id]?.size || ''} onChange={(e) => handleVariantFieldChange(p.id, 'size', e.target.value)} />
                        <InputField label="Vị / Topping" placeholder="VD: Vani" value={variantForms[p.id]?.topping || ''} onChange={(e) => handleVariantFieldChange(p.id, 'topping', e.target.value)} />
                        <InputField label="Kho" type="number" placeholder="0" value={variantForms[p.id]?.stockQuantity || ''} onChange={(e) => handleVariantFieldChange(p.id, 'stockQuantity', e.target.value)} />
                        <InputField label="+ Giá (VNĐ)" type="number" placeholder="0" value={variantForms[p.id]?.priceAdjustment || ''} onChange={(e) => handleVariantFieldChange(p.id, 'priceAdjustment', e.target.value)} />
                        <button onClick={() => handleCreateVariant(p.id)} disabled={savingVariantForProductId === p.id} style={{ padding: '11px 18px', borderRadius: '12px', border: 'none', background: '#0369a1', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                          {savingVariantForProductId === p.id ? '...' : '+ Thêm'}
                        </button>
                      </div>
                    </div>
                  </SectionCard>
                ))}
              </div>
            )}

            {/* ── COUPONS ── */}
            {activeTab === 'coupons' && (
              <div style={{ display: 'grid', gap: '24px' }}>
                <SectionCard title="➕ Tạo mã giảm giá mới">
                  <form onSubmit={handleCreateCoupon}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                      <InputField label="Mã code" name="code" placeholder="VD: BANHNGON20" value={couponForm.code} onChange={handleCouponFieldChange} required />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Loại giảm</label>
                        <select name="discountType" value={couponForm.discountType} onChange={handleCouponFieldChange} style={{ padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.9rem', background: '#fafafa', outline: 'none' }}>
                          <option value="percentage">Phần trăm (%)</option>
                          <option value="fixed">Số tiền cố định</option>
                        </select>
                      </div>
                      <InputField label={couponForm.discountType === 'percentage' ? 'Giảm (%)' : 'Giảm (VNĐ)'} name="discountValue" type="number" placeholder="0" value={couponForm.discountValue} onChange={handleCouponFieldChange} required />
                      <InputField label="Đơn tối thiểu (VNĐ)" name="minOrderAmount" type="number" placeholder="0" value={couponForm.minOrderAmount} onChange={handleCouponFieldChange} />
                      <InputField label="Số lần dùng tối đa" name="maxUses" type="number" placeholder="Không giới hạn" value={couponForm.maxUses} onChange={handleCouponFieldChange} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <InputField label="Hiệu lực từ" name="validFrom" type="date" value={couponForm.validFrom} onChange={handleCouponFieldChange} />
                        <InputField label="Hết hạn" name="validUntil" type="date" value={couponForm.validUntil} onChange={handleCouponFieldChange} />
                      </div>
                    </div>
                    <button type="submit" disabled={savingCoupon} style={{ padding: '13px 32px', borderRadius: '12px', border: 'none', background: 'var(--text-dark)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                      {savingCoupon ? 'Đang tạo...' : '🎫 Tạo mã'}
                    </button>
                  </form>
                </SectionCard>

                <SectionCard title={`🎫 Mã đang hoạt động (${coupons.length})`} noPad>
                  <div style={{ padding: '8px 0' }}>
                    {coupons.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎫</div>
                        <p>Chưa có mã giảm giá nào</p>
                      </div>
                    ) : coupons.map((c, idx) => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 30px', borderBottom: idx < coupons.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <div style={{ background: '#f0fdf4', border: '1.5px dashed #86efac', borderRadius: '10px', padding: '6px 14px' }}>
                            <code style={{ fontWeight: 800, fontSize: '0.95rem', color: '#15803d', letterSpacing: '0.05em' }}>{c.code}</code>
                          </div>
                          <div style={{ fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: 600 }}>
                              {c.discount_type === 'percentage' ? `${c.discount_value}%` : formatCurrency(c.discount_value)}
                            </span>
                            {c.min_order_amount > 0 && <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>đơn từ {formatCurrency(c.min_order_amount)}</span>}
                            {c.max_uses && <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>· tối đa {c.max_uses} lần</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {c.valid_until ? `HH: ${new Date(c.valid_until).toLocaleDateString('vi-VN')}` : 'Không giới hạn'}
                          </span>
                          <button className="ghost-button" style={{ color: '#ef4444', fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => handleDeleteCoupon(c.id)}>
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleOrderStatusChange}
        />
      )}
    </div>
  )
}
