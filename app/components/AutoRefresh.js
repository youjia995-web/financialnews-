'use client'

import { useEffect, useState, useRef } from 'react'

export default function AutoRefresh({ intervalMs = 600000 }) { // 默认 10 分钟
  const [timeLeft, setTimeLeft] = useState(intervalMs / 1000)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const endTimeRef = useRef(Date.now() + intervalMs)
  
  // 使用 ref 避免闭包问题
  const isRefreshingRef = useRef(false)
  isRefreshingRef.current = isRefreshing

  useEffect(() => {
    // 重置结束时间
    endTimeRef.current = Date.now() + intervalMs

    const timer = setInterval(() => {
      const now = Date.now()
      const remaining = Math.ceil((endTimeRef.current - now) / 1000)
      
      if (remaining <= 0) {
        if (!isRefreshingRef.current) {
          handleRefresh()
        }
        setTimeLeft(0)
      } else {
        setTimeLeft(remaining)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [intervalMs])

  const handleRefresh = async () => {
    if (isRefreshingRef.current) return
    
    try {
      setIsRefreshing(true)
      console.log('Auto refreshing data...')
      
      // 设置 15秒 超时，避免请求挂死
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      
      await fetch('/api/refresh', { 
        method: 'POST',
        signal: controller.signal
      }).catch(e => console.warn('Refresh request failed or timeout:', e))
      
      clearTimeout(timeoutId)
    } catch (e) {
      console.error('Auto refresh error:', e)
    } finally {
      // 无论成功失败，都刷新页面以获取最新数据（如果有的话）并重置状态
      console.log('Reloading page...')
      window.location.reload()
    }
  }

  // 格式化时间显示 mm:ss
  const minutes = Math.floor(timeLeft / 60)
  const seconds = Math.floor(timeLeft % 60)
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ 
        color: '#94a3b8', 
        fontSize: 14, 
        fontVariantNumeric: 'tabular-nums', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 6,
        background: '#1e293b',
        padding: '4px 8px',
        borderRadius: 4,
        border: '1px solid #334155'
      }}>
        {isRefreshing ? (
          <>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22d3ee', display: 'inline-block', animation: 'pulse 1s infinite' }} />
            <span>更新中...</span>
          </>
        ) : (
          <>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            <span>{timeStr} 后刷新</span>
          </>
        )}
      </span>
      
      {/* 只要不在刷新中，就提供一个立即刷新的小按钮 */}
      {!isRefreshing && (
        <button 
          onClick={handleRefresh}
          title="立即刷新"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#22d3ee',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6"></path>
            <path d="M1 20v-6h6"></path>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </button>
      )}

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
