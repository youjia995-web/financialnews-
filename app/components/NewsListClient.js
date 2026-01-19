'use client'

import { useState } from 'react'

export default function NewsListClient({ initialItems }) {
  const [items, setItems] = useState(initialItems)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [generating, setGenerating] = useState(false)

  const toggleSelect = (id) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
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
