'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'

export default function AIEntries() {
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)
  
  // 默认选择今天
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)

  const handleGenerate = async () => {
    setLoading(true)
    setReport(null)
    
    const start = new Date(date + 'T00:00:00').getTime()
    const end = new Date(date + 'T23:59:59').getTime()

    try {
      const res = await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start, end })
      })
      
      const json = await res.json()
      if (json.ok) {
        setReport(json.report.content)
      } else {
        alert('生成失败: ' + (json.error || '未知错误'))
      }
    } catch (e) {
      console.error(e)
      alert('网络请求失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* 左侧：AI 财经情报官 (可展开) */}
        <div 
          onClick={() => setIsReportOpen(!isReportOpen)}
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #ec4899)',
            borderRadius: 12,
            padding: '16px 24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'white',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🤖</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>AI 财经情报官</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>全天脉络整理 · 宏观情绪推演</div>
            </div>
          </div>
          <div>{isReportOpen ? '收起 ▲' : '展开 ▼'}</div>
        </div>

        {/* 右侧：AI 个股分析官 (跳转链接) */}
        <Link 
          href="/analyst"
          style={{
            background: 'linear-gradient(135deg, #0ea5e9, #10b981)',
            borderRadius: 12,
            padding: '16px 24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: 'white',
            textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <span style={{ fontSize: 24 }}>📈</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>AI 个股分析官</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>深度诊断 · 智能问答 · 策略生成</div>
          </div>
        </Link>
      </div>

      {/* 展开的研报区域 (仅针对情报官) */}
      {isReportOpen && (
        <div style={{ 
          background: '#1e293b', 
          marginTop: 16, 
          borderRadius: 12, 
          padding: 20,
          border: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
            <span style={{ color: '#cbd5e1' }}>选择日期:</span>
            <input 
              type="date" 
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{
                background: '#0f172a',
                border: '1px solid #475569',
                color: 'white',
                padding: '8px 12px',
                borderRadius: 6
              }}
            />
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                background: loading ? '#64748b' : '#22d3ee',
                color: '#0f172a',
                border: 'none',
                padding: '8px 20px',
                borderRadius: 6,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '正在分析数据 (约1-2分钟)...' : '生成情报研报'}
            </button>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🧠</div>
              <div>AI 正在阅读海量新闻，进行去重、分析与推演...</div>
            </div>
          )}

          {report && (
            <div className="markdown-body" style={{ 
              background: '#0f172a', 
              padding: 24, 
              borderRadius: 8, 
              border: '1px solid #334155',
              lineHeight: 1.8
            }}>
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
