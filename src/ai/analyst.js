const prisma = require('../../lib/prisma')
const qwen = require('./qwen')
const deepseek = require('./deepseek')
const tavily = require('../tools/tavily')
const TI = require('technicalindicators')
const tushare = require('../fetchers/tushare')

// 格式化数字
const fmt = (n) => {
  if (n === null || n === undefined) return '-'
  if (typeof n === 'number') return n.toFixed(2)
  return '-'
}

/**
 * 使用 JavaScript 计算技术指标 (technicalindicators)
 */
function calculateIndicators(data) {
  // 提取序列
  const closes = data.map(d => d.close)
  const highs = data.map(d => d.high)
  const lows = data.map(d => d.low)
  const volumes = data.map(d => d.vol)

  // 1. Moving Averages
  const ma5 = TI.SMA.calculate({ period: 5, values: closes })
  const ma20 = TI.SMA.calculate({ period: 20, values: closes })
  const ma60 = TI.SMA.calculate({ period: 60, values: closes })

  // 2. MACD (12, 26, 9)
  const macdInput = {
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  }
  const macd = TI.MACD.calculate(macdInput)

  // 3. RSI (14)
  const rsi = TI.RSI.calculate({ period: 14, values: closes })

  // 4. Bollinger Bands (20, 2)
  const bb = TI.BollingerBands.calculate({ period: 20, stdDev: 2, values: closes })

  // 5. ATR (14)
  const atr = TI.ATR.calculate({ period: 14, high: highs, low: lows, close: closes })

  // 6. Historical Volatility (20 days)
  // Log returns
  const logReturns = []
  for (let i = 1; i < closes.length; i++) {
    logReturns.push(Math.log(closes[i] / closes[i - 1]))
  }
  // Rolling std dev * sqrt(252)
  const volatility = []
  for (let i = 0; i < logReturns.length; i++) {
    if (i < 19) {
      volatility.push(null)
      continue
    }
    const slice = logReturns.slice(i - 19, i + 1)
    const mean = slice.reduce((a, b) => a + b, 0) / slice.length
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / slice.length
    const std = Math.sqrt(variance)
    volatility.push(std * Math.sqrt(252))
  }

  // 7. Key Events Screening
  const events = []
  
  // Calculate Vol MA5 for comparison
  const volMa5 = TI.SMA.calculate({ period: 5, values: volumes })

  // We need to align arrays. TI returns arrays shorter than input by (period-1).
  // Let's iterate from the end backwards to find recent events.
  // Using original data index.
  
  const len = data.length
  // Helper to get indicator value by original index
  const getVal = (arr, idx, offset) => {
    const arrIdx = idx - offset
    return (arrIdx >= 0 && arrIdx < arr.length) ? arr[arrIdx] : null
  }

  // Iterate last 30 days to find events
  for (let i = len - 1; i >= Math.max(0, len - 30); i--) {
    const row = data[i]
    const prevRow = data[i-1]
    
    if (!row || !prevRow) continue

    // Price Change > +/- 5%
    // Note: pct_chg in DB might be null, calculate manually if needed
    let pctChg = row.pct_chg
    if (pctChg === null || pctChg === undefined) {
      pctChg = ((row.close - prevRow.close) / prevRow.close) * 100
    }

    if (pctChg > 5) {
      events.push({ date: row.trade_date, reason: '大涨', pct_chg: pctChg, close: row.close, rsi: getVal(rsi, i, 14) })
    } else if (pctChg < -5) {
      events.push({ date: row.trade_date, reason: '大跌', pct_chg: pctChg, close: row.close, rsi: getVal(rsi, i, 14) })
    }

    // Volume > 3 * MA5(Vol)
    // Vol MA5 is shifted by 1 (avg of PREVIOUS 5 days usually, but here we compare to current moving avg or prev?)
    // Let's use avg of [i-5...i-1]
    let prev5VolAvg = 0
    if (i >= 5) {
      const slice = volumes.slice(i-5, i)
      prev5VolAvg = slice.reduce((a,b)=>a+b,0) / 5
    }
    
    if (prev5VolAvg > 0 && row.vol > 3 * prev5VolAvg) {
      // Avoid duplicate date if already added
      if (!events.find(e => e.date === row.trade_date)) {
        events.push({ date: row.trade_date, reason: '巨量', pct_chg: pctChg, close: row.close, rsi: getVal(rsi, i, 14) })
      }
    }
  }

  // Sort events by date asc, take last 10
  events.sort((a,b) => a.date.localeCompare(b.date))
  const recentEvents = events.slice(-10)

  // Latest status
  const lastIdx = len - 1
  const latest = {
    date: data[lastIdx].trade_date,
    close: data[lastIdx].close,
    ma5: getVal(ma5, lastIdx, 4),
    ma20: getVal(ma20, lastIdx, 19),
    ma60: getVal(ma60, lastIdx, 59),
    rsi: getVal(rsi, lastIdx, 14),
    macd: getVal(macd, lastIdx, 25)?.MACD, 
    volatility: volatility[lastIdx - 1],
    pct_chg: data[lastIdx].pct_chg
  }

  // Extract full series for chart (last 120 points)
  const chartData = []
  const startIdx = Math.max(0, len - 120)
  for (let i = startIdx; i < len; i++) {
    chartData.push({
      date: data[i].trade_date,
      close: data[i].close,
      vol: data[i].vol,
      amount: data[i].amount,
      ma5: getVal(ma5, i, 4),
      ma20: getVal(ma20, i, 19),
      ma60: getVal(ma60, i, 59)
    })
  }

  return { latest, events: recentEvents, chartData }
}

/**
 * 功能 1: 个股深度诊断 (Qwen-Max) - 三引擎驱动版
 */
async function analyzeStock(code) {
  // 1. 模糊匹配股票代码
  let tsCode = code
  // 如果是纯数字，尝试去数据库查后缀，或者默认补齐（这里简单处理：如果是6位数字，优先查库，查不到则根据首位猜测）
  // 但既然改为实时获取，最好用户能输入完整代码，或者我们在这里做智能补全
  if (/^\d{6}$/.test(code)) {
    const match = await prisma.stockDaily.findFirst({
      where: { ts_code: { startsWith: code } },
      select: { ts_code: true }
    })
    if (match) {
      tsCode = match.ts_code
    } else {
      // 简单规则：60/68 -> SH, 00/30 -> SZ, 8/4 -> BJ
      if (code.startsWith('6')) tsCode = `${code}.SH`
      else if (code.startsWith('0') || code.startsWith('3')) tsCode = `${code}.SZ`
      else if (code.startsWith('8') || code.startsWith('4')) tsCode = `${code}.BJ`
    }
  }

  // 2. [数据引擎] 调用 Tushare API 获取实时历史数据 (150天)
  // 移除本地数据库查询
  let history = []
  let stockName = tsCode // 默认用代码
  let apiError = null

  try {
    const [histData, basicData] = await Promise.all([
      tushare.fetchHistory(tsCode, 150),
      tushare.fetchStockBasic(tsCode)
    ])
    history = histData
    if (basicData && basicData.name) {
      stockName = basicData.name
    }
  } catch (e) {
    console.error('Tushare fetch failed:', e)
    apiError = e.message
  }

  // 如果 API 失败且本地有数据，尝试降级读取本地 (Optional)
  if (history.length === 0) {
     console.log('Tushare API returned empty, trying local DB fallback...')
     history = await prisma.stockDaily.findMany({
       where: { ts_code: tsCode },
       orderBy: { trade_date: 'asc' }, // 本地数据库取出来是 ASC
       take: 150
     })

     // 检查本地数据时效性
     if (history.length > 0) {
        const lastDate = history[history.length - 1].trade_date
        // YYYYMMDD -> Date
        const y = parseInt(lastDate.slice(0, 4))
        const m = parseInt(lastDate.slice(4, 6)) - 1
        const d = parseInt(lastDate.slice(6, 8))
        const lastDateObj = new Date(y, m, d)
        
        const now = new Date()
        const diffTime = Math.abs(now - lastDateObj)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        console.log(`Local data last date: ${lastDate}, diff days: ${diffDays}`)

        // 如果数据超过 15 天未更新，视为失效
        if (diffDays > 15) {
           throw new Error(`无法获取最新行情: 外部接口异常 (${apiError || 'No Data'}), 且本地数据已严重过时 (${lastDate})。请联系管理员检查 Tushare Token。`)
        }
     }
  }

  if (history.length === 0) {
    throw new Error(`未找到股票 ${tsCode} 的历史数据 (Tushare Error: ${apiError || 'Empty Result'})`)
  }

  // history 现在是 ASC 排序（旧->新）。latest 是数组最后一个元素。
  console.log(`Analyzing ${tsCode} with ${history.length} records. Latest date: ${history[history.length-1].trade_date}`)

  // 使用 JS 计算指标
  let indicators
  try {
    indicators = calculateIndicators(history)
  } catch (e) {
    console.error('Indicator calculation failed:', e)
    indicators = {
      latest: { close: history[history.length-1].close, date: history[history.length-1].trade_date },
      events: []
    }
  }

  const { latest, events } = indicators

  // 3. [信息引擎] Tavily 历史归因 + 实时搜索
  const eventPromises = events.map(async (evt) => {
    const query = `${tsCode} ${evt.date} ${evt.reason} 原因`
    const res = await tavily.search(query, { max_results: 3 })
    const summary = res?.results?.[0]?.content || '未找到相关新闻'
    return `[${evt.date}] ${evt.reason} (涨跌幅 ${fmt(evt.pct_chg)}%, RSI:${fmt(evt.rsi)}): ${summary}`
  })

  // 同时搜索今日实时新闻
  const todaySearchPromise = tavily.search(`${tsCode} 股票 最新消息 利好 利空`)

  const [eventContexts, todayRes] = await Promise.all([
    Promise.all(eventPromises),
    todaySearchPromise
  ])

  const historyContext = eventContexts.join('\n')
  const todayContext = todayRes?.results?.map(r => `[${r.title}] ${r.content}`).join('\n') || '暂无今日资讯'

  // 4. [决策引擎] 构建 Prompt 喂给 Qwen-Max
  const prompt = `
你是一位精通量化交易与基本面分析的资深基金经理。请基于以下“数据+信息”对股票【${tsCode}】进行深度复盘与策略生成。

## 📊 第一部分：当前技术面特征 (数据引擎)
- **最新收盘**: ${fmt(latest.close)} (日期: ${latest.date})
- **均线系统**: MA5=${fmt(latest.ma5)}, MA20=${fmt(latest.ma20)}, MA60=${fmt(latest.ma60)}
- **情绪指标**: RSI(14)=${fmt(latest.rsi)} (超买>80, 超卖<20)
- **趋势指标**: MACD=${fmt(latest.macd)}
- **波动率**: 年化历史波动率=${latest.volatility ? fmt(latest.volatility * 100) : '-'}%

(注意：如果指标显示为 '-'，表示数据不足无法计算，请根据收盘价走势进行定性分析)

## 📰 第二部分：历史股性归因 (信息引擎)
这是该股过去几次大涨/大跌/巨量日期的当时新闻背景，请分析其“股性”：
${historyContext}

## 🌐 第三部分：今日实时情报
${todayContext}

## 🧠 第四部分：深度分析与策略 (决策引擎)
请严格按照以下 Markdown 格式输出分析报告：

📌 核心信息提炼
### 🔴 核心结论
[一句话给出明确的多空判断，如：均线空头排列且套牢盘重，建议观望]
------
### 🧬 股性分析
* **消息敏感度**：[分析该股对政策、财报还是市场情绪更敏感？]
* **反弹规律**：[暴跌后通常多久企稳？是否存在假摔习惯？]
------
### 📊 基本面与市场情绪
- **业绩/基本面**：...
- **舆情/情绪**：...
------
### ⚠️ 风险
1. ...
2. ...
------
### ✨ 利好
1. ...
2. ...
------
### ♟️ 交易策略建议
根据当前指标与股性，生成具体策略：
- **策略 A (困境反转)**：[如果 RSI<20 且无实质利空，何时买入？]
- **策略 B (趋势跟随)**：[如果突破 MA60 且有配合消息，如何追涨？]
------
### 💡 今日操作指令
- **空仓者**：...
- **持仓者**：...
`

  // 5. 调用 Qwen-Max
  const analysis = await qwen.generate(prompt, { temperature: 0.4 })

  // 6. 返回结构化数据
  return {
    meta: {
      code: tsCode,
      name: stockName, 
      price: latest.close,
      change: latest.pct_chg,
      date: latest.date
    },
    klineData: indicators.chartData,
    indicators: latest,
    analysis
  }
}

/**
 * 功能 2: 智能财经问答 (DeepSeek)
 */
async function analyzeQuery(query) {
  try {
    console.log(`[Analyst] Processing query: ${query}`)
    
    // 1. Tavily 搜索
    const searchRes = await tavily.search(query)
    const webContext = searchRes?.results?.map(r => `[${r.title}] ${r.content}`).join('\n') || ''
    console.log(`[Analyst] Tavily found ${searchRes?.results?.length || 0} results`)

    // 2. 本地财经新闻聚合 (最近 24 小时, 取最新的 20 条)
    const yesterday = BigInt(Date.now() - 24 * 60 * 60 * 1000)
    const localNews = await prisma.news.findMany({
      where: { published_at: { gte: yesterday } },
      orderBy: { published_at: 'desc' },
      take: 20,
      select: { title: true, brief: true }
    })
    const localContext = localNews.map(n => `[快讯] ${n.title}: ${n.brief}`).join('\n')
    console.log(`[Analyst] Local news found ${localNews.length} items`)

    // 3. 构建 Prompt
    const messages = [
      { role: 'system', content: '你是一位博学的财经专家，擅长结合实时网络信息和市场快讯回答用户问题。回答要条理清晰，引用数据支持。请在回答末尾添加“仅供参考，不构成投资建议”的免责声明。' },
      { role: 'user', content: `
请回答用户问题：${query}

参考信息：
【网络搜索】
${webContext}

【市场快讯】
${localContext}

请综合以上信息给出深度回答：
` }
    ]

    // 4. 调用 DeepSeek
    console.log('[Analyst] Calling DeepSeek...')
    const response = await deepseek.chat(messages, { temperature: 0.5, max_tokens: 2000 })
    console.log('[Analyst] DeepSeek response received')
    return response

  } catch (e) {
    console.error('[Analyst] analyzeQuery failed:', e)
    throw new Error(`智能问答服务暂时繁忙: ${e.message}`)
  }
}

module.exports = { analyzeStock, analyzeQuery }
