'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function MobileNewsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      const res = await fetch('/api/news')
      if (res.ok) {
        const json = await res.json()
        setItems(json.items || [])
      }
    } catch (e) {
      console.error('Fetch news error:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/refresh', { method: 'POST' })
      if (res.ok) {
        await fetchNews()
      }
    } catch (e) {
      console.error('Refresh error:', e)
    } finally {
      setRefreshing(false)
    }
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const getSourceColor = (source) => {
    const colors = {
      'eastmoney': '#ea580c',
      'wallstreetcn': '#8b5cf6',
      'cls': '#3b82f6'
    }
    return colors[source] || '#64748b'
  }

  const getSourceName = (source) => {
    const names = {
      'eastmoney': '东财',
      'wallstreetcn': '华尔街',
      'cls': '财联社'
    }
    return names[source] || source
  }

  const formatTime = (timestamp) => {
    // 处理 BigInt 类型的时间戳
    const ts = typeof timestamp === 'bigint' ? Number(timestamp) : Number(timestamp)
    const date = new Date(ts)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    
    // 处理未来时间（可能是时区或数据问题）
    if (diff < 0) {
      return '刚刚'
    }
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <main style={{ 
      background: '#0f172a', 
      minHeight: '100vh', 
      color: '#e2e8f0',
      paddingBottom: 80
    }}>
      <header style={{ 
        position: 'sticky',
        top: 0,
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        zIndex: 100
      }}>
        <Link href="/mobile" style={{ color: '#94a3b8', fontSize: 20 }}>←</Link>
        <div style={{ fontWeight: 700, fontSize: 18, flex: 1 }}>
          <span style={{ color: '#93c5fd' }}>财经</span>快讯
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            background: 'rgba(34, 211, 238, 0.1)',
            border: 'none',
            color: '#22d3ee',
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 14,
            cursor: refreshing ? 'wait' : 'pointer'
          }}
        >
          {refreshing ? '刷新中...' : '刷新'}
        </button>
      </header>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          加载中...
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          暂无新闻数据
        </div>
      ) : (
        <div style={{ padding: '12px' }}>
          {items.map((item) => (
            <article 
              key={item.id} 
              style={{
                background: '#1e293b',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                marginBottom: 10,
                fontSize: 12
              }}>
                <span style={{
                  background: getSourceColor(item.source),
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontWeight: 500
                }}>
                  {getSourceName(item.source)}
                </span>
                <span style={{ color: '#64748b' }}>{formatTime(item.published_at)}</span>
                <span style={{
                  marginLeft: 'auto',
                  background: item.sentiment?.score >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: item.sentiment?.score >= 0 ? '#22c55e' : '#ef4444',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 11
                }}>
                  {item.sentiment?.score >= 0 ? '利好' : '利空'}
                </span>
              </div>
              
              <h3 style={{ 
                fontSize: 16, 
                fontWeight: 600, 
                lineHeight: 1.5,
                marginBottom: 8,
                color: '#f1f5f9'
              }}>
                {item.title}
              </h3>
              
              {item.brief && (
                <div style={{ marginBottom: 10 }}>
                  <p style={{ 
                    fontSize: 14, 
                    color: '#94a3b8', 
                    lineHeight: 1.6,
                    margin: 0,
                    display: expandedId === item.id ? 'block' : '-webkit-box',
                    WebkitLineClamp: expandedId === item.id ? 'unset' : 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {item.brief}
                  </p>
                  {item.brief.length > 60 && (
                    <button
                      onClick={() => toggleExpand(item.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#22d3ee',
                        fontSize: 13,
                        padding: '4px 0',
                        marginTop: 4,
                        cursor: 'pointer'
                      }}
                    >
                      {expandedId === item.id ? '收起 ↑' : '展开更多 ↓'}
                    </button>
                  )}
                </div>
              )}

              {item.ai_note && (
                <div style={{
                  background: 'rgba(34, 211, 238, 0.1)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 13,
                  color: '#22d3ee',
                  marginBottom: 10
                }}>
                    💡 {item.ai_note}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 13,
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}
                >
                  查看原文
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '12px 0'
      }}>
        <Link href="/mobile" style={{ textAlign: 'center', color: '#64748b', textDecoration: 'none' }}>
          <div style={{ fontSize: 20 }}>🏠</div>
          <div style={{ fontSize: 10, marginTop: 4 }}>首页</div>
        </Link>
        <Link href="/mobile/news" style={{ textAlign: 'center', color: '#22d3ee', textDecoration: 'none' }}>
          <div style={{ fontSize: 20 }}>📰</div>
          <div style={{ fontSize: 10, marginTop: 4 }}>快讯</div>
        </Link>
        <Link href="/mobile/analyst" style={{ textAlign: 'center', color: '#64748b', textDecoration: 'none' }}>
          <div style={{ fontSize: 20 }}>📈</div>
          <div style={{ fontSize: 10, marginTop: 4 }}>诊断</div>
        </Link>
      </nav>
    </main>
  )
}
