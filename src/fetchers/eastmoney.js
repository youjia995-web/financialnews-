const prisma = require('../../lib/prisma')
const { derive } = require('../sentiment')

async function fetchList() {
  const url = 'https://kuaixun.eastmoney.com/kuaixun/v1/get_list_7_24'
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0'
    }
  })
  if (!res.ok) throw new Error(`eastmoney http ${res.status}`)
  const json = await res.json()
  const list = json?.items || []
  return list.map(x => ({
    id: String(x.id),
    source: 'eastmoney',
    title: x.title || '',
    brief: x.digest || '',
    content: x.content || '',
    url: x.url_w || '',
    published_at: (x.showtime ? new Date(x.showtime).getTime() : Date.now()),
    raw: JSON.stringify(x)
  }))
}

async function saveItems(items) {
  let count = 0
  for (const it of items) {
    const senti = derive(it)
    const doc = {
      id: it.id,
      source: it.source,
      title: it.title,
      brief: it.brief,
      content: it.content,
      url: it.url,
      published_at: BigInt(it.published_at),
      ai_note: '',
      sentiment_score: senti.score,
      created_at: BigInt(Date.now())
    }
    try {
      await prisma.news.upsert({
        where: { id: it.id },
        update: {},
        create: doc
      })
      count++
    } catch (e) {
      console.error(`[eastmoney] save error for ${it.id}:`, e)
    }
  }
  return count
}

async function runOnce() {
  try {
    const items = await fetchList()
    await saveItems(items)
    return items.length
  } catch (e) {
    console.error('[eastmoney] fetch failed:', e.message)
    return 0
  }
}

module.exports = { runOnce }
