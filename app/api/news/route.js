import { getNewsCol } from '../../../lib/db-wrapper'

export const dynamic = 'force-dynamic'

export async function GET() {
  const col = await getNewsCol()
  const rows = col.chain().simplesort('published_at', true).limit(50).data()
  const items = rows.map(r => ({
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
  return Response.json({ items })
}
