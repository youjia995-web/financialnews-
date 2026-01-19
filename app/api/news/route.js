import prisma from '../../../lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  const where = {}
  
  // 构建查询条件
  if (start || end) {
    where.published_at = {}
    if (start) where.published_at.gte = BigInt(start)
    if (end) where.published_at.lte = BigInt(end)
  }

  // 排序并限制数量
  const limit = (start || end) ? 500 : 50
  
  try {
    const rows = await prisma.news.findMany({
      where,
      orderBy: { published_at: 'desc' },
      take: limit
    })
    
    const items = rows.map(r => ({
      id: r.id,
      source: r.source,
      title: r.title,
      brief: r.brief,
      content: r.content,
      url: r.url,
      published_at: Number(r.published_at), // BigInt 转 Number
      ai_note: r.ai_note,
      sentiment: { score: r.sentiment_score }
    }))
    return Response.json({ items })
  } catch (e) {
    console.error('Fetch news error:', e)
    return Response.json({ items: [] }, { status: 500 })
  }
}
