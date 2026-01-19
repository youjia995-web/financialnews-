export const dynamic = 'force-dynamic'

export default async function NotesPage() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:6081'
  const res = await fetch(`${base}/api/notes`, { method: 'POST', cache: 'no-store' })
  const ok = res.ok
  const json = ok ? await res.json() : null
  return (
    <main style={{ padding: 20 }}>
      <h1>{ok ? `已生成 ${json?.count ?? 0} 条评注` : '生成失败'}</h1>
      <a href="/" style={{ color: '#0ea5e9' }}>返回首页</a>
    </main>
  )
}
