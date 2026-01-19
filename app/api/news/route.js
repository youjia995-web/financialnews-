import { getNewsCol } from '../../../lib/db-wrapper'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  const col = await getNewsCol()
  
  let chain = col.chain()
  
  // 构建查询条件
  const query = {}
  if (start || end) {
    query.published_at = {}
    if (start) query.published_at['$gte'] = parseInt(start)
    if (end) query.published_at['$lte'] = parseInt(end)
  }

  // 如果有时间筛选，则应用查询条件；否则默认只查最新的
  if (Object.keys(query).length > 0) {
    chain = chain.find(query)
  }

  // 排序并限制数量 (如果有筛选条件，可以放宽限制，或者分页，这里暂时保持 limit 50 或根据需求调整)
  // 为了防止导出大量数据时 API 超时，查询接口还是限制一下数量，但导出接口可以放宽
  const limit = (start || end) ? 500 : 50
  
  const rows = chain.simplesort('published_at', true).limit(limit).data()
  
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
