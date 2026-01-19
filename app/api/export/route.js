import { getNewsCol } from '../../../lib/db-wrapper'
import * as XLSX from 'xlsx'

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

  if (Object.keys(query).length > 0) {
    chain = chain.find(query)
  }

  // 导出不限制数量，或者限制大一点，比如 5000
  const rows = chain.simplesort('published_at', true).limit(5000).data()

  // 转换数据格式
  const data = rows.map(r => ({
    '发布时间': new Date(r.published_at).toLocaleString(),
    '来源': r.source === 'eastmoney' ? '东财' : (r.source === 'futu' ? '富途' : '财联社'),
    '标题': r.title,
    '摘要': r.brief,
    '内容': r.content,
    '原文链接': r.url,
    '情感得分': r.sentiment_score || 0,
    'AI评注': r.ai_note || ''
  }))

  // 创建 Workbook
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(data)
  XLSX.utils.book_append_sheet(workbook, worksheet, 'News')

  // 生成 Buffer
  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  // 返回文件流
  return new Response(buf, {
    status: 200,
    headers: {
      'Content-Disposition': `attachment; filename="news_export_${Date.now()}.xlsx"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  })
}
