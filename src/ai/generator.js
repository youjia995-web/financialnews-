const { getNewsCol } = require('../../lib/db-wrapper')
const { generateNote } = require('./deepseek')

async function run(limit = 5) {
  const col = await getNewsCol()
  const items = col.find({ ai_note: '' }).slice(0, limit)
  let ok = 0
  for (const it of items) {
    try {
      const note = await generateNote(it)
      if (note) {
        it.ai_note = note
        col.update(it)
        ok++
      }
    } catch {}
  }
  await col.save()
  return ok
}

async function runBatch(ids) {
  const col = await getNewsCol()
  // 查找指定 ID 且尚未生成评注的新闻，或者已生成但需重新生成的（如果需要）
  // 这里逻辑是：只要 ID 匹配就生成，覆盖旧的
  const items = col.find({ id: { $in: ids } })
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
          it.ai_note = note
          col.update(it)
          updatedItems.push(it)
        }
      } catch (e) {
        console.error(`Failed to note ${it.id}:`, e.message)
      }
    }))
  }
  
  if (updatedItems.length > 0) {
    await col.save()
  }
  return updatedItems
}

module.exports = { run, runBatch }
