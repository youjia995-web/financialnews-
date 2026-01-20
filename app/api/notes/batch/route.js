import prisma from '../../../../lib/prisma'
import { generateNote } from '../../../../src/ai/generator'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request) {
  try {
    const { ids } = await request.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json({ items: [] })
    }

    // 查库
    const items = await prisma.news.findMany({
      where: { id: { in: ids } }
    })
    
    // 逐个生成 (并行)
    const tasks = items.map(async (item) => {
      try {
        const prompt = `
【标题】${item.title}
【摘要】${item.brief || ''}
【内容】${(item.content || '').substring(0, 500)}

请用一句话点评这条新闻对资本市场的影响（利好/利空/中性及原因）。
`
        const note = await generateNote(prompt)
        
        // 回写数据库
        await prisma.news.update({
          where: { id: item.id },
          data: { ai_note: note }
        })
        
        return { id: item.id, ai_note: note }
      } catch (err) {
        console.error(`Failed to generate note for ${item.id}:`, err)
        return { id: item.id, ai_note: '生成失败' }
      }
    })

    const results = await Promise.all(tasks)
    return Response.json({ items: results })
  } catch (e) {
    console.error('Batch notes error:', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
