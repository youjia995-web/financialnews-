const prisma = require('../../lib/prisma')
const { derive } = require('../sentiment')

async function fetchList() {
  const url = 'https://np-listapi.eastmoney.com/comm/web/getFastNewsList?client=web&biz=web_724&fastColumn=102&sortEnd=1&pageIndex=1&pageSize=100&req_trace=1'
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Referer': 'https://kuaixun.eastmoney.com/'
    }
  })
  if (!res.ok) throw new Error(`eastmoney http ${res.status}`)
  const json = await res.json()
  const list = json?.data?.fastNewsList || []
  return list.map(x => ({
    id: String(x.code),
    source: 'eastmoney',
    title: x.title || '',
    brief: x.summary || '',
    content: x.summary || '',
    url: `https://kuaixun.eastmoney.com/news/${x.code}.html`,
    published_at: x.showTime ? new Date(x.showTime).getTime() : Date.now(),
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
