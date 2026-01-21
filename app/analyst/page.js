'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'

export default function AnalystPage() {
  const [activeTab, setActiveTab] = useState('stock') // 'stock' | 'query'
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    setLoading(true)
    setResult('')

    try {
      const endpoint = activeTab === 'stock' ? '/api/analyst/stock' : '/api/analyst/query'
      const body = activeTab === 'stock' ? { code: input } : { query: input }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        const json = await res.json()
        setResult(json.result)
      } else {
        const json = await res.json()
        setResult(`Error: ${json.error || '请求失败'}`)
      }
    } catch (e) {
      setResult(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#e2e8f0', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '16px 24px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 20, fontWeight: 'bold' }}>
          <span style={{ color: '#22d3ee' }}>AI</span> 财经分析官
        </div>
        <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>返回首页</Link>
      </header>

      <main style={{ flex: 1, maxWidth: 800, width: '100%', margin: '0 auto', padding: 24 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <button
            onClick={() => { setActiveTab('stock'); setInput(''); setResult('') }}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'stock' ? '#22d3ee' : '#1e293b',
              color: activeTab === 'stock' ? '#0f172a' : '#94a3b8',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            个股深度诊断
          </button>
          <button
            onClick={() => { setActiveTab('query'); setInput(''); setResult('') }}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'query' ? '#22d3ee' : '#1e293b',
              color: activeTab === 'query' ? '#0f172a' : '#94a3b8',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            智能财经问答
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeTab === 'stock' ? '请输入股票代码 (如 600000)' : '请输入您的问题 (如 特斯拉最近有什么大新闻)'}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: 8,
                border: '1px solid #334155',
                background: '#1e293b',
                color: 'white',
                fontSize: 16
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0 32px',
                borderRadius: 8,
                border: 'none',
                background: loading ? '#64748b' : '#3b82f6',
                color: 'white',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 16
              }}
            >
              {loading ? '分析中...' : '提交'}
            </button>
          </div>
        </form>

        {/* Result Area */}
        {result && (
          <div style={{ background: '#1e293b', padding: 32, borderRadius: 12, border: '1px solid #334155' }}>
            <article className="prose prose-invert" style={{ maxWidth: 'none', lineHeight: 1.6 }}>
              <ReactMarkdown>{result}</ReactMarkdown>
            </article>
          </div>
        )}
        
        {!result && !loading && (
          <div style={{ textAlign: 'center', color: '#64748b', marginTop: 64 }}>
            <p>输入代码或问题，AI 将为您提供深度分析。</p>
          </div>
        )}
      </main>
    </div>
  )
}
