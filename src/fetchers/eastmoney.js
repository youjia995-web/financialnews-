const db = require('../db')
const { getNewsCol } = require('../../lib/db-wrapper')
const { derive } = require('../sentiment')

async function fetchList() {
  // 东方财富 7x24 全球直播
  // 接口地址: https://newsapi.eastmoney.com/kuaixun/v1/getlist_102_ajaxResult_50_1_.html
  const url = 'https://newsapi.eastmoney.com/kuaixun/v1/getlist_102_ajaxResult_50_1_.html'
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://kuaixun.eastmoney.com/',
    'Accept': '*/*'
  }

  const res = await fetch(url, { headers })
  if (!res.ok) {
    throw new Error(`EastMoney API http ${res.status}`)
  }

  const text = await res.text()
  // 接口返回 var ajaxResult={...}，需要去掉前缀
  const jsonStr = text.replace(/^var ajaxResult=/, '')
  const json = JSON.parse(jsonStr)
  const list = json?.LivesList || []
  
  return list.map(x => ({
    id: String(x.newsid || x.id),
    source: 'eastmoney',
    title: x.title || '',
    brief: x.digest || x.summary || '',
    content: x.digest || '', // 东财快讯通常只有摘要，没有长文
    url: x.url_w || x.url_unique || '',
    published_at: x.showtime ? new Date(x.showtime).getTime() : Date.now(),
    raw: JSON.stringify(x)
  }))
}

async function saveItems(items) {
  const col = await getNewsCol()
  let added = 0
  for (const it of items) {
    // 简单的去重逻辑
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
        added++
      } catch (e) {
        console.error('[eastmoney] insert error:', e.message)
      }
    }
  }
  if (added > 0) {
    await col.save()
    console.log(`[eastmoney] saved ${added} new items to db`)
  } else {
    console.log('[eastmoney] no new items to save')
  }
}

async function runOnce() {
  try {
    const items = await fetchList()
    if (items.length > 0) {
      await saveItems(items)
    }
    return items.length
  } catch (e) {
    console.error('[eastmoney] run error:', e.message)
    return 0
  }
}

module.exports = { runOnce }
