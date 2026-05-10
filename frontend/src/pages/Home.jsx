import { Link } from 'react-router-dom'
import { formatCurrency } from '../utils/helpers'

export default function Home() {
  const featuredProducts = [
    {
      id: 'prod-001',
      name: 'Bánh Chocolate Ganache Cao Cấp',
      description: 'Hương vị chocolate đậm đà hòa quyện cùng lớp phủ ganache mịn màng, tan chảy ngay đầu lưỡi.',
      price: 350000,
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'prod-002',
      name: 'Bánh Red Velvet Quyến Rũ',
      description: 'Sắc đỏ nồng nàn kết hợp cùng lớp kem phô mai béo ngậy, biểu tượng của sự sang trọng và tình yêu.',
      price: 420000,
      image: 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'prod-003',
      name: 'Bánh Dâu Tây Pastel Dịu Ngọt',
      description: 'Vị ngọt thanh khiết từ dâu tây tươi Đà Lạt và kem tươi đánh bông, mang lại cảm giác nhẹ nhàng.',
      price: 380000,
      image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=80'
    }
  ]

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        alignItems: 'center', 
        gap: '60px',
        marginBottom: '100px'
      }}>
        <div className="hero-content">
          <p className="eyebrow">Chào mừng bạn đến với Nghe Nghe Bakery</p>
          <h2 style={{ 
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', 
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: '32px'
          }}>
            Nghệ thuật làm bánh từ <span style={{ color: 'var(--accent)' }}>trái tim</span> và đam mê
          </h2>
          <p style={{ 
            fontSize: '1.2rem', 
            color: 'var(--text-muted)', 
            lineHeight: 1.6, 
            marginBottom: '48px',
            maxWidth: '500px'
          }}>
            Chúng tôi mang đến những chiếc bánh kem thiết kế riêng, sử dụng nguyên liệu cao cấp nhất để ngày đặc biệt của bạn trở nên hoàn hảo và đáng nhớ.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link to="/catalog" className="primary-button" style={{ padding: '18px 40px' }}>
              Khám phá ngay
            </Link>
            <Link to="/orders" className="ghost-button" style={{ padding: '18px 40px' }}>
              Lịch sử đơn hàng
            </Link>
          </div>
        </div>
        <div className="hero-image" style={{ position: 'relative' }}>
          <img 
            src="https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=1000&q=80" 
            alt="Premium Cake" 
            style={{ 
              width: '100%', 
              borderRadius: '40px', 
              boxShadow: '0 30px 60px rgba(0,0,0,0.15)',
              transform: 'rotate(2deg)'
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: '-20px',
            left: '-20px',
            background: 'white',
            padding: '24px',
            borderRadius: '24px',
            boxShadow: 'var(--shadow-premium)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ fontSize: '2rem' }}>⭐</div>
            <div>
              <div style={{ fontWeight: 800 }}>4.9/5</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Từ 2,000+ khách hàng</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section style={{ marginBottom: '120px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-end',
          marginBottom: '50px' 
        }}>
          <div>
            <p className="eyebrow">Đặc trưng</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem' }}>Sản phẩm nổi bật</h2>
          </div>
          <Link to="/catalog" className="ghost-button">Xem tất cả →</Link>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '30px' 
        }}>
          {featuredProducts.map((product) => (
            <article key={product.id} className="product-card-hero" style={{ 
              background: 'white',
              padding: '24px',
              borderRadius: '32px',
              boxShadow: 'var(--shadow-premium)',
              transition: 'transform 0.3s ease'
            }}>
              <div style={{ 
                height: '300px', 
                borderRadius: '24px', 
                overflow: 'hidden', 
                marginBottom: '24px'
              }}>
                <img 
                  src={product.image} 
                  alt={product.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <h3 style={{ 
                fontFamily: 'var(--font-heading)', 
                fontSize: '1.4rem', 
                marginBottom: '12px' 
              }}>{product.name}</h3>
              <p style={{ 
                color: 'var(--text-muted)', 
                fontSize: '0.95rem', 
                lineHeight: '1.5',
                marginBottom: '24px',
                minHeight: '4.5em'
              }}>{product.description}</p>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingTop: '20px',
                borderTop: '1px solid var(--border-subtle)'
              }}>
                <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>{formatCurrency(product.price)}</span>
                <Link to="/catalog" className="primary-button" style={{ padding: '10px 24px' }}>Mua ngay</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Values Section */}
      <section style={{ 
        background: 'var(--text-dark)', 
        color: 'white', 
        padding: '100px 60px', 
        borderRadius: '50px',
        marginBottom: '120px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <p className="eyebrow" style={{ color: 'var(--accent)' }}>Giá trị cốt lõi</p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem' }}>Tại sao chọn Nghe Nghe Bakery?</h2>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '60px' 
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '30px' }}>🎂</div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: '16px' }}>Nguyên liệu tươi mới</h4>
            <p style={{ opacity: 0.7, lineHeight: '1.6' }}>Chúng tôi cam kết sử dụng trái cây tươi và kem cao cấp trong ngày để đảm bảo hương vị tuyệt vời nhất.</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '30px' }}>🎨</div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: '16px' }}>Thiết kế theo yêu cầu</h4>
            <p style={{ opacity: 0.7, lineHeight: '1.6' }}>Đội ngũ nghệ nhân làm bánh sẵn sàng hiện thực hóa mọi ý tưởng độc đáo của riêng bạn.</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '30px' }}>🚚</div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: '16px' }}>Giao hàng hỏa tốc</h4>
            <p style={{ opacity: 0.7, lineHeight: '1.6' }}>Dịch vụ giao hàng chuyên nghiệp, đảm bảo bánh luôn giữ được hình dáng hoàn hảo khi đến tay bạn.</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section style={{ 
        textAlign: 'center', 
        padding: '60px 20px',
        background: 'var(--accent-light)',
        borderRadius: '40px'
      }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '16px' }}>Liên hệ với chúng tôi</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Chúng tôi luôn sẵn sàng lắng nghe và phục vụ bạn</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: '8px' }}>Địa chỉ</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>123 Đường Bánh Kem, Quận 1, TP. HCM</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: '8px' }}>Hotline</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>090 123 4567</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: '8px' }}>Email</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>hello@nghenghebakery.com</div>
          </div>
        </div>
      </section>
    </div>
  )
}

