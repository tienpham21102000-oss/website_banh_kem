import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { addToCart } from '../api/cartAPI'
import { getCategories, getProductById, getProducts } from '../api/productAPI'
import { formatCurrency, getErrorMessage } from '../utils/helpers'
import { Link } from 'react-router-dom'

export default function Catalog({ session }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoadingId, setDetailLoadingId] = useState(null)
  const [addingVariantId, setAddingVariantId] = useState(null)

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        const [prodRes, catRes] = await Promise.all([
          getProducts(),
          getCategories()
        ])
        setProducts(prodRes.data.products || [])
        setCategories(catRes.data.categories || [])
      } catch (error) {
        toast.error(getErrorMessage(error, 'Không thể tải dữ liệu'))
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [])

  const handleSelectProduct = async (productId) => {
    setDetailLoadingId(productId)
    try {
      const { data } = await getProductById(productId)
      setSelectedProduct(data)
      if (window.innerWidth < 768) {
        document.querySelector('.detail-panel')?.scrollIntoView({ behavior: 'smooth' })
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể tải chi tiết sản phẩm'))
    } finally {
      setDetailLoadingId(null)
    }
  }

  const handleAddToCart = async (variantId) => {
    if (!session.token) {
      toast.error('Bạn cần đăng nhập trước khi thêm vào giỏ hàng')
      return
    }
    setAddingVariantId(variantId)
    try {
      await addToCart(variantId, 1)
      toast.success('Đã thêm vào giỏ hàng thành công')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể thêm vào giỏ hàng'))
    } finally {
      setAddingVariantId(null)
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesCategory = !selectedCategoryId || p.category_id === selectedCategoryId
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="catalog-page">
      <div className="step-indicator" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '40px', 
        marginBottom: '60px',
        padding: '20px',
        background: 'rgba(255, 255, 255, 0.5)',
        borderRadius: '24px'
      }}>
        <div className="step-item active" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)', fontWeight: 700 }}>
          <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'grid', placeItems: 'center' }}>1</span>
          <span>Chọn bánh</span>
        </div>
        <div className="step-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.4 }}>
          <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ccc', color: 'white', display: 'grid', placeItems: 'center' }}>2</span>
          <span>Giỏ hàng</span>
        </div>
        <div className="step-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.4 }}>
          <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ccc', color: 'white', display: 'grid', placeItems: 'center' }}>3</span>
          <span>Thanh toán</span>
        </div>
      </div>

      <header style={{ marginBottom: '60px', textAlign: 'center' }}>
        <p className="eyebrow">Thực đơn đặc sắc</p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', marginBottom: '16px' }}>Khám Phá Hương Vị Ngọt Ngào</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto' }}>
          Trải nghiệm những mẫu bánh kem hiện đại, ít ngọt, sử dụng nguyên liệu cao cấp nhất từ Nghe Nghe Bakery.
        </p>
      </header>

      <div className="catalog-layout" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 380px', 
        gap: '40px' 
      }}>
        <div className="catalog-main">
          <div className="catalog-controls" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '40px',
            background: 'white',
            padding: '12px 24px',
            borderRadius: '20px',
            boxShadow: 'var(--shadow-premium)'
          }}>
            <div className="category-filters" style={{ display: 'flex', gap: '8px' }}>
              <button 
                className={`ghost-button ${selectedCategoryId === '' ? 'active' : ''}`}
                onClick={() => setSelectedCategoryId('')}
                style={selectedCategoryId === '' ? { background: 'var(--text-dark)', color: 'white' } : {}}
              >
                Tất cả
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  className="ghost-button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  style={selectedCategoryId === cat.id ? { background: 'var(--text-dark)', color: 'white' } : {}}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            
            <div className="search-wrapper" style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Tìm tên bánh..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  padding: '10px 16px', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-main)',
                  width: '240px'
                }}
              />
            </div>
          </div>

          <div className="products-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '30px' 
          }}>
            {loading ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px' }}>
                <p>Đang chuẩn bị bánh ngon...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', background: 'white', borderRadius: '32px' }}>
                <p>Chúng mình chưa tìm thấy chiếc bánh nào khớp với yêu cầu của bạn rồi.</p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <article key={product.id} className="product-card" style={{ 
                  background: 'white',
                  borderRadius: '28px',
                  padding: '20px',
                  boxShadow: 'var(--shadow-premium)',
                  transition: 'all 0.3s'
                }}>
                  <div style={{ 
                    height: '240px', 
                    borderRadius: '20px', 
                    overflow: 'hidden', 
                    marginBottom: '20px',
                    cursor: 'pointer'
                  }} onClick={() => handleSelectProduct(product.id)}>
                    <img src={product.image_url} alt={product.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{product.name}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '20px', minHeight: '3em' }}>{product.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '1.1rem' }}>từ {formatCurrency(product.base_price)}</span>
                    <button
                      className="primary-button"
                      onClick={() => handleSelectProduct(product.id)}
                      style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                    >
                      {detailLoadingId === product.id ? '...' : 'Xem chi tiết'}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <aside className="detail-panel">
          {!selectedProduct ? (
            <div style={{ 
              background: 'white', 
              padding: '40px', 
              borderRadius: '32px', 
              textAlign: 'center', 
              position: 'sticky', 
              top: '120px',
              border: '2px dashed var(--border-subtle)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🍰</div>
              <p style={{ color: 'var(--text-muted)' }}>Chọn một chiếc bánh để tùy chỉnh kích thước và thêm vào giỏ hàng nhé!</p>
            </div>
          ) : (
            <div style={{ 
              background: 'white', 
              padding: '30px', 
              borderRadius: '32px', 
              boxShadow: 'var(--shadow-premium)', 
              position: 'sticky', 
              top: '120px' 
            }}>
              <p className="eyebrow">Sản phẩm đang xem</p>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', marginBottom: '20px' }}>{selectedProduct.name}</h3>
              <div style={{ height: '200px', borderRadius: '20px', overflow: 'hidden', marginBottom: '20px' }}>
                <img src={selectedProduct.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '30px' }}>{selectedProduct.description}</p>
              
              <div style={{ display: 'grid', gap: '12px' }}>
                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Chọn kích cỡ & hương vị:</p>
                {(selectedProduct.variants || []).map((variant) => {
                  const totalPrice = Number(selectedProduct.base_price) + Number(variant.price_adjustment || 0)
                  return (
                    <div key={variant.id} style={{ 
                      padding: '16px', 
                      borderRadius: '16px', 
                      background: 'var(--bg-main)', 
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>Size {variant.size}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{variant.topping}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: 'var(--accent)', marginBottom: '8px' }}>{formatCurrency(totalPrice)}</div>
                        <button
                          className="primary-button"
                          onClick={() => handleAddToCart(variant.id)}
                          disabled={addingVariantId === variant.id || Number(variant.stock_quantity) <= 0}
                          style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                        >
                          {addingVariantId === variant.id ? '...' : 'Thêm vào giỏ'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </aside>
      </div>

      <div style={{ 
        position: 'fixed', 
        bottom: '40px', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        zIndex: 100 
      }}>
        <Link to="/cart" className="primary-button" style={{ 
          boxShadow: '0 15px 30px rgba(0,0,0,0.2)', 
          padding: '16px 40px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderRadius: '99px',
          background: 'var(--accent)'
        }}>
          <span>Xem giỏ hàng của bạn</span>
          <span style={{ background: 'white', color: 'var(--accent)', width: '24px', height: '24px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 800 }}>➔</span>
        </Link>
      </div>
    </div>
  )
}
