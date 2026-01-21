const prisma = require('../../lib/prisma')

const API_URL = 'http://api.tushare.pro'

async function callTushare(apiName, params) {
  const token = process.env.TUSHARE_TOKEN
  if (!token) {
    throw new Error('TUSHARE_TOKEN is missing')
  }

  const body = {
    api_name: apiName,
    token: token,
    params: params
  }

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    const json = await res.json()
    if (json.code !== 0) {
      throw new Error(`Tushare API error: ${json.msg}`)
    }
    return json.data
  } catch (e) {
    console.error('[tushare] request failed:', e.message)
    return null
  }
}

async function saveDailyData(fields, items) {
  if (!items || items.length === 0) return 0

  // Map fields to object
  // fields: [ "ts_code", "trade_date", "open", ... ]
  // items: [ [ "000001.SZ", "20240120", 10.0, ... ], ... ]
  
  const data = items.map(item => {
    const row = {}
    fields.forEach((key, idx) => {
      row[key] = item[idx]
    })
    return {
      ts_code: row.ts_code,
      trade_date: row.trade_date,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      pre_close: row.pre_close,
      change: row.change,
      pct_chg: row.pct_chg,
      vol: row.vol,
      amount: row.amount
    }
  })

  // Batch insert
  let saved = 0
  const BATCH_SIZE = 1000
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const chunk = data.slice(i, i + BATCH_SIZE)
    try {
      await prisma.stockDaily.createMany({
        data: chunk,
        skipDuplicates: true
      })
      saved += chunk.length
    } catch (e) {
      console.error('[tushare] save batch error:', e.message)
    }
  }
  return saved
}

async function runDaily() {
  const now = new Date()
  // Format YYYYMMDD
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  
  console.log(`[tushare] fetching daily data for ${dateStr}...`)
  
  const data = await callTushare('daily', { trade_date: dateStr })
  if (!data) return 0

  const count = await saveDailyData(data.fields, data.items)
  console.log(`[tushare] saved ${count} rows for ${dateStr}`)
  return count
}

module.exports = { runDaily, callTushare }
