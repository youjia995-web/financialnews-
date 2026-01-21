'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'
import {
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

export default function AnalystPage() {
  const [activeTab, setActiveTab] = useState('stock') // 'stock' | 'query'
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null) // 结构化数据
  const [error, setError] = useState('')

  const [loadingStep, setLoadingStep] = useState(0) // 0: idle, 1: searching, 2: reading, 3: thinking

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    setLoading(true)
    setLoadingStep(1) // Start searching
    setResult(null)
    setError('')

    // Simulate steps
    const t1 = setTimeout(() => setLoadingStep(2), 2000)
    const t2 = setTimeout(() => setLoadingStep(3), 5000)

    try {
      const endpoint = activeTab === 'stock' ? '/api/analyst/stock' : '/api/analyst/query'
      const body = activeTab === 'stock' ? { code: input } : { query: input }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      let json
      try {
        const text = await res.text()
        json = JSON.parse(text)
      } catch (err) {
        throw new Error(`服务器响应异常: ${res.status} ${res.statusText}`)
      }

      if (res.ok) {
        setResult(json.result)
      } else {
        setError(json.error || '请求失败')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      clearTimeout(t1)
      clearTimeout(t2)
      setLoading(false)
      setLoadingStep(0)
    }
  }

  // 格式化数字
  const fmt = (n) => typeof n === 'number' ? n.toFixed(2) : '-'

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#e2e8f0', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '16px 24px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 20, fontWeight: 'bold' }}>
          <span style={{ color: '#22d3ee' }}>AI</span> 财经分析官
        </div>
        <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>返回首页</Link>
      </header>

      <main style={{ flex: 1, maxWidth: 1000, width: '100%', margin: '0 auto', padding: 24 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <button
            onClick={() => { setActiveTab('stock'); setInput(''); setResult(null); setError('') }}
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
            onClick={() => { setActiveTab('query'); setInput(''); setResult(null); setError('') }}
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

        {error && (
          <div style={{ padding: 16, background: '#450a0a', color: '#fca5a5', borderRadius: 8, marginBottom: 24 }}>
            {error}
          </div>
        )}

        {/* Result Area */}
        {loading && (
          <div style={{ background: '#1e293b', padding: 40, borderRadius: 12, border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }} className="animate-pulse">
              {loadingStep === 1 ? '🔍' : loadingStep === 2 ? '📰' : '🧠'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#e2e8f0', marginBottom: 8 }}>
              {loadingStep === 1 ? '正在搜索全网信息...' : loadingStep === 2 ? '正在聚合市场快讯...' : 'AI 正在进行深度推理...'}
            </div>
            <div style={{ color: '#94a3b8', fontSize: 14 }}>
              {loadingStep === 3 ? '耗时可能较长 (约30-60秒)，请耐心等待' : '正在获取最新数据'}
            </div>
          </div>
        )}

        {result && !loading && (
          <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
            
            {/* 0. 智能问答结果 (Query 模式) */}
            {activeTab === 'query' && typeof result === 'string' && (
              <div style={{ padding: 32 }}>
                <article className="prose prose-invert" style={{ maxWidth: 'none', lineHeight: 1.6 }}>
                  <ReactMarkdown>{result}</ReactMarkdown>
                </article>
              </div>
            )}

            {/* 1. 股票基本信息 (仅个股模式) */}
            {activeTab === 'stock' && result.meta && (
              <div style={{ padding: '24px 32px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                    {result.meta.code} {result.meta.name !== result.meta.code ? result.meta.name : ''}
                    <span style={{ fontSize: 14, background: '#334155', padding: '2px 8px', borderRadius: 4, color: '#94a3b8' }}>{result.meta.date}</span>
                  </h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 32, fontWeight: 'bold', color: result.meta.change >= 0 ? '#f87171' : '#4ade80' }}>
                    {result.meta.price}
                  </div>
                  <div style={{ fontSize: 16, color: result.meta.change >= 0 ? '#f87171' : '#4ade80' }}>
                    {result.meta.change >= 0 ? '+' : ''}{result.meta.change}%
                  </div>
                </div>
              </div>
            )}

            {/* 2. 走势图 (仅个股模式) */}
            {activeTab === 'stock' && result.klineData && (
              <div style={{ height: 400, padding: '24px 32px 0 0' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={result.klineData}>
                    <defs>
                      <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{fill: '#94a3b8', fontSize: 12}} 
                      tickFormatter={(v) => v.slice(4)} // 20240101 -> 0101
                      stroke="#475569"
                    />
                    <YAxis 
                      yAxisId="left"
                      domain={['auto', 'auto']} 
                      tick={{fill: '#94a3b8', fontSize: 12}} 
                      stroke="#475569"
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      domain={['auto', 'auto']} 
                      tick={{fill: '#94a3b8', fontSize: 12}} 
                      stroke="#475569"
                      hide={true} // 隐藏右轴刻度，避免视觉杂乱
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#e2e8f0' }}
                      itemStyle={{ color: '#e2e8f0' }}
                      formatter={(value, name) => [fmt(value), name === 'vol' ? '成交量(手)' : name === 'amount' ? '成交额(千元)' : name]}
                      labelFormatter={(label) => `日期: ${label}`}
                    />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="close" stroke="#8884d8" fillOpacity={1} fill="url(#colorClose)" name="收盘价" />
                    <Line yAxisId="left" type="monotone" dataKey="ma5" stroke="#22d3ee" dot={false} strokeWidth={2} name="MA5" />
                    <Line yAxisId="left" type="monotone" dataKey="ma20" stroke="#fbbf24" dot={false} strokeWidth={2} name="MA20" />
                    <Bar yAxisId="right" dataKey="vol" fill="#82ca9d" opacity={0.3} name="成交量" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 3. 核心指标 (仅个股模式) */}
            {activeTab === 'stock' && result.indicators && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, padding: '24px 32px', borderBottom: '1px solid #334155' }}>
                <div style={{ background: '#0f172a', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>RSI (14)</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold' }}>{fmt(result.indicators.rsi)}</div>
                </div>
                <div style={{ background: '#0f172a', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>MACD</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold' }}>{fmt(result.indicators.macd)}</div>
                </div>
                <div style={{ background: '#0f172a', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>MA60</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold' }}>{fmt(result.indicators.ma60)}</div>
                </div>
                <div style={{ background: '#0f172a', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>历史波动率</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                    {result.indicators.volatility ? fmt(result.indicators.volatility * 100) : '-'}%
                  </div>
                </div>
              </div>
            )}

            {/* 4. AI 深度报告 */}
            {result.analysis && (
              <div style={{ padding: 32, borderTop: '1px solid #334155' }}>
                <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#facc15' }}>AI 深度研报</h3>
                <article className="prose prose-invert" style={{ maxWidth: 'none', lineHeight: 1.6 }}>
                  <ReactMarkdown>
                    {result.analysis}
                  </ReactMarkdown>
                </article>
              </div>
            )}

          </div>
        )}
        
        {!result && !loading && !error && (
          <div style={{ textAlign: 'center', color: '#64748b', marginTop: 64 }}>
            <p>输入代码或问题，AI 将为您提供深度分析。</p>
          </div>
        )}
      </main>
    </div>
  )
}
