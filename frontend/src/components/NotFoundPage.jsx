import { Armchair } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FAF8F5',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      padding: '24px',
      color: '#2A1E17'
    }}>
      <div style={{
        maxWidth: '560px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        padding: '48px 36px',
        textAlign: 'center',
        boxShadow: '0 20px 40px -15px rgba(42, 30, 23, 0.08)',
        border: '1px solid #EFECE6'
      }}>
        {/* Icon & Badge */}
        <div style={{
          width: '76px',
          height: '76px',
          margin: '0 auto 24px',
          borderRadius: '50%',
          backgroundColor: '#FFF7ED',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#D97706',
          boxShadow: '0 8px 16px -4px rgba(217, 119, 6, 0.15)'
        }}>
          <Armchair size={38} strokeWidth={1.8} />
        </div>

        {/* Big 404 */}
        <div style={{
          fontSize: '4.5rem',
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: '-0.04em',
          color: '#2A1E17',
          marginBottom: '12px',
          background: 'linear-gradient(135deg, #2A1E17, #D97706)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          404
        </div>

        <h1 style={{
          fontSize: '1.45rem',
          fontWeight: 700,
          color: '#2A1E17',
          margin: '0 0 12px 0',
          letterSpacing: '-0.02em'
        }}>
          Không Tìm Thấy Trang Yêu Cầu
        </h1>

        <p style={{
          fontSize: '0.92rem',
          lineHeight: 1.6,
          color: '#78716C',
          margin: '0 auto 24px auto',
          maxWidth: '420px'
        }}>
          Có vẻ như đường dẫn bạn nhập không tồn tại hoặc món đồ nội thất bạn đang tìm đã được di dời sang danh mục khác.
        </p>

        {/* Footer info */}
        <div style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid #F3EFEA',
          fontSize: '0.78rem',
          color: '#A8A29E'
        }}>
          FuniStore - Thiết kế tử tế, sống an yên • Hotline hỗ trợ: <strong>1900 6868</strong>
        </div>
      </div>
    </div>
  )
}
