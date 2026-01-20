const prisma = require('../../lib/prisma')
const { derive } = require('../sentiment')

const API_ENDPOINT = 'https://api-one-wscn.awtmt.com/apiv1/content/lives'

async function fetchChannel(channel) {
  const url = `${API_ENDPOINT}?channel=${channel}&limit=50`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    
    if (!res.ok) {
      console.warn(`[wallstreetcn] fetch ${channel} failed: ${res.status}`)
      return []
    }

    const json = await res.json()
    const items = json?.data?.items || []

    return items.map(x => {
      // 华尔街见闻很多快讯没有标题，只有内容。
      // 如果没有标题，就用内容的前30个字作为标题。
      let title = x.title || ''
      let brief = x.content_text || ''
      
      if (!title && brief) {
        title = brief.substring(0, 50) + (brief.length > 50 ? '...' : '')
      }

      return {
        id: String(x.id),
        source: 'wallstreetcn', // 统一标记为 wallstreetcn，或者可以区分 wallstreetcn-global / wallstreetcn-astock
        title: title,
        brief: brief,
        content: x.content || x.content_text || '',
        url: x.uri || '',
        published_at: x.display_time ? x.display_time * 1000 : Date.now(),
        raw: JSON.stringify(x)
      }
    })
  } catch (e) {
    console.error(`[wallstreetcn] fetch ${channel} error:`, e.message)
    return []
  }
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
      // ignore unique constraint error or others
    }
  }
  return count
}

async function runOnce() {
  try {
    // 并行抓取 Global 和 A-Stock
    const [globalItems, astockItems] = await Promise.all([
      fetchChannel('global-channel'),
      fetchChannel('a-stock-channel')
    ])

    // 合并并去重 (id 相同的会被后面 saveItems 的 upsert 处理，或者在数组层面先去重)
    const allItems = [...globalItems, ...astockItems]
    
    // 简单的数组去重，避免重复处理
    const uniqueItems = []
    const seen = new Set()
    for (const it of allItems) {
      if (!seen.has(it.id)) {
        seen.add(it.id)
        uniqueItems.push(it)
      }
    }

    await saveItems(uniqueItems)
    return uniqueItems.length
  } catch (e) {
    console.error('[wallstreetcn] runOnce failed:', e.message)
    return 0
  }
}

module.exports = { runOnce }
