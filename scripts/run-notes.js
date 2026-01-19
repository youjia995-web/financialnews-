const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })
const prisma = require('../lib/prisma')
const { generateNote } = require('../src/ai/generator')

async function run(limit = 10) {
  console.log(`[notes] checking items without notes (limit ${limit})...`)
  
  // 查找没有 ai_note 的新闻
  const items = await prisma.news.findMany({
    where: {
      OR: [
        { ai_note: null },
        { ai_note: '' }
      ]
    },
    orderBy: { published_at: 'desc' },
    take: limit
  })

  if (items.length === 0) {
    console.log('[notes] no items need notes')
    return
  }

  console.log(`[notes] found ${items.length} items`)
  
  let count = 0
  for (const item of items) {
    try {
      console.log(`[notes] generating for ${item.id} ${item.title.substring(0, 20)}...`)
      
      const prompt = `
【标题】${item.title}
【摘要】${item.brief || ''}
【内容】${(item.content || '').substring(0, 500)}

请用一句话点评这条新闻对资本市场的影响（利好/利空/中性及原因）。
`
      const note = await generateNote(prompt)
      if (note) {
        await prisma.news.update({
          where: { id: item.id },
          data: { ai_note: note }
        })
        count++
        console.log(`[notes] saved note for ${item.id}`)
      }
      
      // 避免并发过高
      await new Promise(r => setTimeout(r, 1000))
    } catch (e) {
      console.error(`[notes] error for ${item.id}:`, e.message)
    }
  }
  
  console.log(`[notes] done, processed ${count} items`)
}

// CLI args
const args = process.argv.slice(2)
const limitArg = args.find(a => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 10

run(limit)
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
