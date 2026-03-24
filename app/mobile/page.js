import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function MobileHomePage() {
  return (
    <main style={{ 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
      minHeight: '100vh', 
      color: '#e2e8f0',
      padding: 0
    }}>
      <header style={{ 
        padding: '20px 16px', 
        textAlign: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ fontWeight: 700, fontSize: 28, marginBottom: 8 }}>
          <span style={{ color: '#93c5fd' }}>Huoking</span>
          <span style={{ color: '#22d3ee' }}>News</span>.AI
        </div>
        <div style={{ color: '#94a3b8', fontSize: 14 }}>智能财经决策平台 · 移动版</div>
      </header>

      <section style={{ padding: '24px 16px' }}>
        <div style={{ 
          color: '#94a3b8', 
          fontSize: 12, 
          textTransform: 'uppercase', 
          letterSpacing: 1,
          marginBottom: 16 
        }}>
          功能入口
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Link href="/mobile/news" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
              borderRadius: 16,
              padding: '24px 20px',
              boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 16
            }}>
              <div style={{
                width: 56,
                height: 56,
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28
              }}>
                📰
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 20, color: 'white' }}>财经快讯</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 }}>实时财经新闻聚合 · AI点评</div>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 24 }}>›</div>
            </div>
          </Link>

          <Link href="/mobile/analyst" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
              borderRadius: 16,
              padding: '24px 20px',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 16
            }}>
              <div style={{
                width: 56,
                height: 56,
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28
              }}>
                📈
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 20, color: 'white' }}>个股诊断</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 }}>AI深度分析 · 技术指标</div>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 24 }}>›</div>
            </div>
          </Link>
        </div>
      </section>

      <section style={{ padding: '0 16px 24px' }}>
        <div style={{ 
          color: '#94a3b8', 
          fontSize: 12, 
          textTransform: 'uppercase', 
          letterSpacing: 1,
          marginBottom: 16 
        }}>
          平台特色
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: 12 
        }}>
          {[
            { icon: '⚡', title: '实时快讯', desc: '24小时监控' },
            { icon: '🤖', title: 'AI点评', desc: '智能分析' },
            { icon: '📊', title: '技术指标', desc: '专业分析' },
            { icon: '🎯', title: '策略建议', desc: '决策辅助' },
          ].map((item, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 12,
              padding: 16,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{item.title}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ 
        padding: '24px 16px', 
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        marginTop: 'auto'
      }}>
        <div style={{ color: '#64748b', fontSize: 12 }}>
          © 2026 HuokingNews.AI · 仅供参考，不构成投资建议
        </div>
        <Link href="/" style={{ 
          display: 'inline-block',
          marginTop: 12,
          color: '#22d3ee', 
          fontSize: 14,
          textDecoration: 'none'
        }}>
          切换到桌面版 →
        </Link>
      </footer>
    </main>
  )
}
