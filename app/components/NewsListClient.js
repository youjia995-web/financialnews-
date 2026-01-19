'use client'

import { useState } from 'react'

export default function NewsListClient({ initialItems }) {
  const [items, setItems] = useState(initialItems)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [generating, setGenerating] = useState(false)
  
  // 筛选状态
  const [dateRangeType, setDateRangeType] = useState('all') // all, today, yesterday, last7, last30, custom
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRangeChange = (e) => {
    const type = e.target.value
    setDateRangeType(type)
    
    if (type === 'custom') return

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    
    if (type === 'all') {
      setStartDate('')
      setEndDate('')
    } else if (type === 'today') {
      setStartDate(todayStr)
      setEndDate(todayStr)
    } else if (type === 'yesterday') {
      const y = new Date(now)
      y.setDate(y.getDate() - 1)
      const yStr = y.toISOString().split('T')[0]
      setStartDate(yStr)
      setEndDate(yStr)
    } else if (type === 'last7') {
      const d = new Date(now)
      d.setDate(d.getDate() - 6)
      setStartDate(d.toISOString().split('T')[0])
      setEndDate(todayStr)
    } else if (type === 'last30') {
      const d = new Date(now)
      d.setDate(d.getDate() - 29)
      setStartDate(d.toISOString().split('T')[0])
      setEndDate(todayStr)
    }
  }

  const handleManualDateChange = (setter) => (e) => {
    setter(e.target.value)
    setDateRangeType('custom')
  }

  const toggleSelect = (id) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleSearch = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('start', new Date(startDate).getTime())
      if (endDate) params.append('end', new Date(endDate).getTime() + 86399999) // 包含当天结束
      
      const res = await fetch(`/api/news?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setItems(json.items)
      }
    } catch (e) {
      console.error('Search failed:', e)
      alert('查询失败')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    if (startDate) params.append('start', new Date(startDate).getTime())
    if (endDate) params.append('end', new Date(endDate).getTime() + 86399999)
    window.location.href = `/api/export?${params.toString()}`
  }

  const handleGenerate = async () => {
    if (selectedIds.size === 0) return
    setGenerating(true)
    try {
      const ids = Array.from(selectedIds)
      const res = await fetch('/api/notes/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      })
      if (res.ok) {
        const json = await res.json()
        // 更新本地状态显示新评注
        setItems(prev => prev.map(it => {
          const update = json.items.find(u => u.id === it.id)
          return update ? { ...it, ai_note: update.ai_note } : it
        }))
        setSelectedIds(new Set()) // 清空选择
      }
    } catch (e) {
      console.error('Generate notes failed:', e)
      alert('生成失败，请重试')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      {/* 筛选工具栏 */}
      <div style={{ 
        background: '#1e293b', padding: '12px 16px', borderRadius: 8, marginBottom: 16,
        display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#94a3b8', fontSize: 14 }}>时间范围:</span>
          <select 
            value={dateRangeType} 
            onChange={handleRangeChange}
            style={{ 
              background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', 
              padding: '6px 10px', borderRadius: 6, outline: 'none'
            }}
          >
            <option value="all">全部</option>
            <option value="today">今天</option>
            <option value="yesterday">昨天</option>
            <option value="last7">最近7天</option>
            <option value="last30">最近30天</option>
            <option value="custom">自定义</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#94a3b8', fontSize: 14 }}>开始:</span>
          <input 
            type="date" 
            value={startDate} 
            onChange={handleManualDateChange(setStartDate)}
            style={{ 
              background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', 
              padding: '6px 10px', borderRadius: 6 
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#94a3b8', fontSize: 14 }}>结束:</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={handleManualDateChange(setEndDate)}
            style={{ 
              background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', 
              padding: '6px 10px', borderRadius: 6 
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
          <button 
            onClick={handleSearch}
            disabled={loading}
            style={{ 
              background: '#3b82f6', color: 'white', border: 'none', padding: '6px 16px', 
              borderRadius: 6, cursor: loading ? 'wait' : 'pointer' 
            }}
          >
            {loading ? '查询中...' : '查询'}
          </button>
          <button 
            onClick={handleExport}
            style={{ 
              background: '#10b981', color: 'white', border: 'none', padding: '6px 16px', 
              borderRadius: 6, cursor: 'pointer' 
            }}
          >
            导出 Excel
          </button>
        </div>
      </div>

      {/* 悬浮操作栏 */}
      {selectedIds.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1e293b', padding: '12px 24px', borderRadius: 999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 16, zIndex: 100
        }}>
          <span style={{ color: '#e2e8f0' }}>已选 {selectedIds.size} 条</span>
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              background: generating ? '#94a3b8' : '#22c55e', color: '#0f172a',
              padding: '8px 16px', borderRadius: 20, border: 'none', cursor: generating ? 'wait' : 'pointer',
              fontWeight: 600
            }}
          >
            {generating ? '生成中...' : '生成 AI 评注'}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            取消
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map((it) => (
          <article key={it.id} 
            style={{ 
              background: '#ffffff', color: '#0f172a', borderRadius: 8, padding: 14, 
              boxShadow: '0 1px 2px rgba(0,0,0,.1)',
              border: selectedIds.has(it.id) ? '2px solid #22c55e' : '2px solid transparent',
              cursor: 'pointer'
            }}
            onClick={() => toggleSelect(it.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ 
                width: 20, height: 20, borderRadius: 4, 
                border: `2px solid ${selectedIds.has(it.id) ? '#22c55e' : '#cbd5e1'}`,
                background: selectedIds.has(it.id) ? '#22c55e' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {selectedIds.has(it.id) && <span style={{ color: 'white', fontSize: 14 }}>✓</span>}
              </div>
              <div style={{ color: '#475569' }}>
                <span style={{ 
                  marginRight: 8, padding: '2px 6px', borderRadius: 4, fontSize: 12,
                  background: it.source === 'eastmoney' ? '#ea580c' : (it.source === 'futu' ? '#f59e0b' : '#3b82f6'),
                  color: 'white'
                }}>
                  {it.source === 'eastmoney' ? '东财' : (it.source === 'futu' ? '富途' : '财联社')}
                </span>
                {new Date(it.published_at).toLocaleString()}
              </div>
              <div style={{ marginLeft: 'auto', background: it.sentiment?.score >= 0 ? '#e0f2fe' : '#fee2e2', color: it.sentiment?.score >= 0 ? '#0369a1' : '#991b1b', padding: '2px 8px', borderRadius: 999 }}>
                {(it.sentiment?.score >= 0 ? '利好 ' : '利空 ') + (it.sentiment?.score ?? 0)}
              </div>
            </div>
            <h3 style={{ margin: '10px 0 6px', fontSize: 18 }}>{it.title}</h3>
            <Text item={it} />
            <div style={{ marginTop: 8, borderTop: '1px dashed #e2e8f0', paddingTop: 8 }}>
              <div style={{ color: '#64748b', marginBottom: 6 }}>AI 评注：{it.ai_note || '待生成'}</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <a href={it.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ background: '#0ea5e9', color: 'white', padding: '6px 10px', borderRadius: 6 }}>查看原文</a>
                <button onClick={e => e.stopPropagation()} style={{ background: '#e2e8f0', color: '#0f172a', padding: '6px 10px', borderRadius: 6 }}>标记已读</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function Text({ item }) {
  const b = (item.brief || '').trim()
  const c = (item.content || '').trim()
  const text = c && c !== b ? c : (b || c)
  return text ? <p style={{ marginTop: 6, color: '#334155' }}>{text}</p> : null
}
