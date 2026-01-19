const prisma = require('../../lib/prisma')
const { generateNote } = require('./deepseek')

async function run(limit = 5) {
  const items = await prisma.news.findMany({
    where: {
      OR: [
        { ai_note: null },
        { ai_note: '' }
      ]
    },
    take: limit
  })

  let ok = 0
  for (const it of items) {
    try {
      const note = await generateNote(it)
      if (note) {
        await prisma.news.update({
          where: { id: it.id },
          data: { ai_note: note }
        })
        ok++
      }
    } catch {}
  }
  return ok
}

async function runBatch(ids) {
  const items = await prisma.news.findMany({
    where: { id: { in: ids } }
  })
  
  const updatedItems = []

  // 并发执行，每批最多 5 个，防止请求积压但提高速度
  const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size))
  
  for (const batch of chunk(items, 5)) {
    await Promise.all(batch.map(async (it) => {
      try {
        const note = await Promise.race([
          generateNote(it),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
        ])
        if (note) {
          await prisma.news.update({
            where: { id: it.id },
            data: { ai_note: note }
          })
          updatedItems.push({ ...it, ai_note: note })
        }
      } catch (e) {
        console.error(`Failed to note ${it.id}:`, e.message)
      }
    }))
  }
  
  return updatedItems
}

module.exports = { run, runBatch }
