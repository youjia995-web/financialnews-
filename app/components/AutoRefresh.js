'use client'

import { useEffect, useState, useRef } from 'react'

export default function AutoRefresh({ intervalMs = 600000 }) { // 默认 10 分钟
  const [timeLeft, setTimeLeft] = useState(intervalMs / 1000)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // 使用 ref 来避免闭包陷阱，确保定时器里能读到最新的状态
  const isRefreshingRef = useRef(false)
  isRefreshingRef.current = isRefreshing

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (!isRefreshingRef.current) {
            handleRefresh()
          }
          return intervalMs / 1000
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [intervalMs])

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)
      // 主动触发后端采集
      await fetch('/api/refresh', { method: 'POST' })
      // 使用 window.location.reload() 替代 router.refresh()
      // router.refresh() 在开发环境下容易触发 net::ERR_ABORTED 或状态不更新的问题
      // 强制刷新虽然体验稍差（白屏一下），但数据同步最稳
      window.location.reload()
    } catch (e) {
      console.error('Auto refresh failed:', e)
      setIsRefreshing(false)
    }
  }

  // 格式化时间显示 mm:ss
  const minutes = Math.floor(timeLeft / 60)
  const seconds = Math.floor(timeLeft % 60)
  const timeStr = `${minutes}m ${seconds}s`

  return (
    <span style={{ color: '#94a3b8', fontSize: 14, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 6 }}>
      {isRefreshing && (
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22d3ee', display: 'inline-block', animation: 'pulse 1s infinite' }} />
      )}
      {isRefreshing ? '正在更新...' : `${timeStr} 后刷新`}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </span>
  )
}
