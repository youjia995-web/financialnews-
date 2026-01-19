const prisma = require('../../lib/prisma')
const { derive } = require('../sentiment')

async function fetchList() {
  const url = 'https://www.cls.cn/nodeapi/telegraphList?app=CailianpressWeb&os=web&refresh_type=1&order=1&rn=50&sv=8.4.6'
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',
      'Accept': 'application/json, text/plain, */*'
    }
  })
  if (!res.ok) throw new Error(`cls telegraph http ${res.status}`)
  const json = await res.json()
  const list = json?.data?.roll_data || []
  return list.map(x => ({
    id: String(x.id ?? `${x.title}-${x.ctime}`),
    source: 'cls',
    title: x.title || '',
    brief: x.brief || '',
    content: x.content || '',
    url: x.shareurl || '',
    published_at: (x.ctime ? Number(x.ctime) * 1000 : Date.now()),
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
      console.error(`[cls] save error for ${it.id}:`, e)
    }
  }
  return count
}

async function runOnce() {
  const items = await fetchList()
  await saveItems(items)
  return items.length
}

module.exports = { runOnce }
