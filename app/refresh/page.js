export const dynamic = 'force-dynamic'

export default async function RefreshPage() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:6081'
  let ok = false
  try {
    const res = await fetch(`${base}/api/refresh`, { method: 'POST', cache: 'no-store' })
    ok = res.ok
  } catch (e) {
    console.error('Refresh page fetch error:', e)
  }
  
  return (
    <main style={{ padding: 20 }}>
      <h1>{ok ? '已触发刷新' : '刷新触发失败，请稍后重试'}</h1>
      <a href="/" style={{ color: '#0ea5e9' }}>返回首页</a>
    </main>
  )
}
