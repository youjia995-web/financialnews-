'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MobileAnalystPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleAnalyze = async () => {
    if (!code.trim()) return
    
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const res = await fetch('/api/analyst/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() })
      })
      
      if (res.ok) {
        const data = await res.json()
        setResult(data.result)
      } else {
        const err = await res.json()
        setError(err.error || '分析失败')
      }
    } catch (e) {
      setError(e.message || '网络错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
      minHeight: '100vh', 
      color: '#e2e8f0',
      padding: 0
    }}>
      <header style={{ 
        padding: '16px', 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <button 
          onClick={() => router.push('/mobile')}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: '#94a3b8', 
            fontSize: 20,
            cursor: 'pointer'
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>个股诊断</h1>
      </header>

      <div style={{ padding: 16 }}>
        <div style={{ 
          background: '#1e293b', 
          borderRadius: 12, 
          padding: 16,
          marginBottom: 16 
        }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ 
              display: 'block', 
              color: '#94a3b8', 
              fontSize: 14,
              marginBottom: 8 
            }}>
              输入股票代码
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="例如: 601919, 000001"
                style={{
                  flex: 1,
                  background: '#0f172a',
                  border: '1px solid #334155',
                  color: '#e2e8f0',
                  padding: '14px 16px',
                  borderRadius: 8,
                  fontSize: 16,
                  outline: 'none'
                }}
              />
              <button
                onClick={handleAnalyze}
                disabled={loading || !code.trim()}
                style={{
                  background: loading ? '#64748b' : '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '14px 24px',
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: loading ? 'wait' : 'pointer',
                  minWidth: 80
                }}
              >
                {loading ? '分析中...' : '诊断'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ 
            background: '#fee2e2', 
            color: '#991b1b', 
            padding: 16, 
            borderRadius: 8,
            marginBottom: 16 
          }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{
              background: '#1e293b',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12,
                marginBottom: 12 
              }}>
                <span style={{ fontSize: 32 }}>📈</span>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>{result.meta?.name}</div>
                  <div style={{ color: '#64748b', fontSize: 14 }}>{result.meta?.code}</div>
                </div>
                <div style={{ 
                  marginLeft: 'auto',
                  textAlign: 'right'
                }}>
                  <div style={{ 
                    fontSize: 24, 
                    fontWeight: 700,
                    color: result.meta?.change >= 0 ? '#10b981' : '#ef4444'
                  }}>
                    {result.meta?.price}
                  </div>
                  <div style={{ 
                    fontSize: 14,
                    color: result.meta?.change >= 0 ? '#10b981' : '#ef4444'
                  }}>
                    {result.meta?.change >= 0 ? '+' : ''}{result.meta?.change?.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>

            {result.analysis && (
              <div style={{
                background: '#1e293b',
                borderRadius: 12,
                padding: 16,
                lineHeight: 1.6,
                fontSize: 14,
                whiteSpace: 'pre-wrap',
                overflow: 'auto'
              }}>
                <div 
                  dangerouslySetInnerHTML={{ __html: result.analysis.replace(/\n/g, '<br/>') }}
                  style={{ color: '#e2e8f0' }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  )
}
