const path = require('path')
const Loki = require('lokijs')
const prisma = require('../lib/prisma')

async function migrate() {
  console.log('Starting migration from LokiJS to SQLite...')
  
  // 1. 读取 LokiJS 数据
  const dbFile = process.env.LOKI_FILE_PATH || path.join(process.cwd(), 'data.loki')
  const db = new Loki(dbFile, {})
  
  await new Promise((resolve, reject) => {
    db.loadDatabase({}, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })

  const col = db.getCollection('news')
  if (!col) {
    console.log('No news collection found in LokiJS.')
    return
  }

  const items = col.chain().data()
  console.log(`Found ${items.length} items in LokiJS.`)

  let count = 0
  for (const item of items) {
    try {
      await prisma.news.upsert({
        where: { id: item.id },
        update: {}, // 如果存在则不更新
        create: {
          id: item.id,
          source: item.source,
          title: item.title,
          brief: item.brief || null,
          content: item.content || null,
          url: item.url || null,
          published_at: BigInt(item.published_at),
          ai_note: item.ai_note || null,
          sentiment_score: item.sentiment_score || 0,
          created_at: BigInt(item.created_at || Date.now())
        }
      })
      count++
      if (count % 100 === 0) console.log(`Migrated ${count} items...`)
    } catch (e) {
      console.error(`Failed to migrate item ${item.id}:`, e)
    }
  }

  console.log(`Migration completed. Successfully migrated ${count} items.`)
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
