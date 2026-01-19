const db = require('../db')
const { getNewsCol } = require('../../lib/db-wrapper')
const { derive } = require('../sentiment')

async function fetchList() {
  // Futu 7x24 滚动新闻
  // URL: https://news.futunn.com/main/live?chain_id=C3ChTCYyX_wNcF.1kmpksj&lang=zh-cn
  // API (guessed): https://news.futunn.com/main/live-list
  const url = 'https://news.futunn.com/main/live-list?page=1&page_size=50&chain_id=C3ChTCYyX_wNcF.1kmpksj&lang=zh-cn'
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://news.futunn.com/main/live?chain_id=C3ChTCYyX_wNcF.1kmpksj&lang=zh-cn',
    'Accept': 'application/json, text/plain, */*'
  }

  // 如果有 Cookie，带上
  if (process.env.FUTU_COOKIE) {
    headers['Cookie'] = process.env.FUTU_COOKIE
    // console.log('[futu] using cookie:', process.env.FUTU_COOKIE.substring(0, 50) + '...')
  } else {
    console.warn('[futu] no cookie found in env')
  }

  const res = await fetch(url, { headers })
  
  // 检查是否是被拦截的页面 (Futu 会返回 200 但内容是 HTML 403 页面)
  const contentType = res.headers.get('content-type') || ''
  if (!res.ok || contentType.includes('text/html')) {
    console.error('[futu] Failed to fetch: API returned HTML or error. Need valid Cookie?')
    // 尝试解析 HTML 看看是不是 403
    if (contentType.includes('text/html')) {
      const text = await res.text()
      if (text.includes('403')) {
        throw new Error('Futu API 403 Forbidden - Please provide FUTU_COOKIE in .env')
      }
    }
    throw new Error(`Futu API http ${res.status} ${contentType}`)
  }

  const json = await res.json()
  const list = json?.data?.list || []
  
  return list.map(x => ({
    id: String(x.id || x.news_id), // 猜测字段名
    source: 'futu',
    title: x.title || '',
    brief: x.brief || x.description || '', // 猜测字段名
    content: x.content || '',
    url: x.url || x.link || '', // 猜测字段名
    published_at: x.time ? Number(x.time) * 1000 : Date.now(), // 猜测字段名
    raw: JSON.stringify(x)
  }))
}

async function saveItems(items) {
  const col = await getNewsCol()
  for (const it of items) {
    // 简单的去重逻辑，如果已存在则跳过 (loki unique index 会报错)
    const exists = col.by('id', it.id)
    if (!exists) {
      const senti = derive(it)
      const doc = {
        ...it,
        ai_note: '',
        sentiment_score: senti.score,
        created_at: Date.now()
      }
      try {
        col.insert(doc)
      } catch {}
    }
  }
  await col.save()
}

async function runOnce() {
  try {
    const items = await fetchList()
    if (items.length > 0) {
      await saveItems(items)
    }
    return items.length
  } catch (e) {
    console.error('[futu] run error:', e.message)
    return 0
  }
}

module.exports = { runOnce }
