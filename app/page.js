import AutoRefresh from './components/AutoRefresh'
import NewsListClient from './components/NewsListClient'
import { getNewsCol } from '../lib/db-wrapper'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const items = await fetchNews()

  return (
    <main style={{ background: '#0f172a', minHeight: '100vh', color: '#e2e8f0' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ fontWeight: 700, fontSize: 20 }}>
          <span style={{ color: '#93c5fd' }}>Huoking</span>
          <span style={{ color: '#22d3ee' }}>News</span>.AI
        </div>
        <nav style={{ display: 'flex', gap: 8 }}>
          <span style={{ background: '#1e293b', padding: '6px 10px', borderRadius: 6 }}>全部</span>
          <span style={{ background: '#1e293b', padding: '6px 10px', borderRadius: 6 }}>利好</span>
          <span style={{ background: '#1e293b', padding: '6px 10px', borderRadius: 6 }}>利空</span>
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <AutoRefresh />
          <a href="/refresh" style={{ background: '#22d3ee', color: '#0f172a', padding: '6px 10px', borderRadius: 6 }}>刷新</a>
        </div>
      </header>
      <section style={{ maxWidth: 980, margin: '24px auto', padding: '0 16px' }}>
        <NewsListClient initialItems={items} />
      </section>
    </main>
  )
}

async function fetchNews() {
  try {
    const col = await getNewsCol()
    const rows = col.chain().simplesort('published_at', true).limit(50).data()
    return rows.map(r => ({
      id: r.id,
      source: r.source,
      title: r.title,
      brief: r.brief,
      content: r.content,
      url: r.url,
      published_at: r.published_at,
      ai_note: r.ai_note,
      sentiment: { score: r.sentiment_score }
    }))
  } catch (e) {
    console.error('Fetch news error:', e)
    return []
  }
}


