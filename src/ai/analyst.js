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
 * 修复复权价格 (Backward Restoration)
 * 使得最新的收盘价等于真实收盘价，之前的价格根据 pct_chg 倒推
 */
function restorePrices(data) {
  const len = data.length
  if (len === 0) return []
  
  const adjCloses = new Array(len)
  // 最后一个（最新）保持不变
  adjCloses[len - 1] = data[len - 1].close
  
  for (let i = len - 1; i > 0; i--) {
    const currentClose = adjCloses[i]
    const pct = data[i].pct_chg
    
    // Prev = Current / (1 + pct/100)
    if (pct !== null && pct !== undefined) {
      adjCloses[i - 1] = currentClose / (1 + pct / 100)
    } else {
      // Fallback: use raw price ratio
      const rawCurr = data[i].close
      const rawPrev = data[i-1].close
      if (rawCurr !== 0) {
        adjCloses[i - 1] = currentClose * (rawPrev / rawCurr)
      } else {
        adjCloses[i - 1] = rawPrev
      }
    }
  }
  return adjCloses
}

/**
 * 使用 JavaScript 计算技术指标 (technicalindicators)
 */
function calculateIndicators(data) {
  // 1. 数据预处理：复权
  const adjCloses = restorePrices(data)
  
  // 提取序列 (用于非价格指标)
  // const closes = data.map(d => d.close) // Use adjCloses for MA/MACD/RSI/Bollinger
  const highs = data.map(d => d.high) // Note: High/Low should technically be adjusted too, but approx is ok for ATR/KDJ if ratio maintained
  const lows = data.map(d => d.low)
  const volumes = data.map(d => d.vol)
  const amounts = data.map(d => d.amount)

  // 为了 KDJ/ATR 计算准确，High/Low 也应该按比例复权
  // 简单处理：AdjHigh = High * (AdjClose / Close)
  const adjHighs = highs.map((h, i) => h * (adjCloses[i] / data[i].close))
  const adjLows = lows.map((l, i) => l * (adjCloses[i] / data[i].close))

  // 1. Moving Averages (Trend)
  const ma5 = TI.SMA.calculate({ period: 5, values: adjCloses })
  const ma10 = TI.SMA.calculate({ period: 10, values: adjCloses })
  const ma20 = TI.SMA.calculate({ period: 20, values: adjCloses })
  const ma60 = TI.SMA.calculate({ period: 60, values: adjCloses })

  // 2. MACD (12, 26, 9)
  const macdInput = {
    values: adjCloses,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  }
  const macd = TI.MACD.calculate(macdInput)

  // 3. RSI (14)
  const rsi = TI.RSI.calculate({ period: 14, values: adjCloses })

  // 4. KDJ (Stochastic) (9, 3, 3)
  // TI.Stochastic returns { k, d }
  const kdj = TI.Stochastic.calculate({
    high: adjHighs,
    low: adjLows,
    close: adjCloses,
    period: 9,
    signalPeriod: 3
  })

  // 5. Bollinger Bands (20, 2)
  const bb = TI.BollingerBands.calculate({ period: 20, stdDev: 2, values: adjCloses })

  // 6. ATR (14)
  const atr = TI.ATR.calculate({ period: 14, high: adjHighs, low: adjLows, close: adjCloses })

  // 7. Volatility (20 days)
  const logReturns = []
  for (let i = 1; i < adjCloses.length; i++) {
    logReturns.push(Math.log(adjCloses[i] / adjCloses[i - 1]))
  }
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

  // 8. Volume MA (5)
  const volMa5 = TI.SMA.calculate({ period: 5, values: volumes })

  // 9. Key Events Screening (Legacy logic + New Logic)
  const events = []
  const len = data.length
  
  // Helper
  const getVal = (arr, idx, offset) => {
    const arrIdx = idx - offset
    return (arrIdx >= 0 && arrIdx < arr.length) ? arr[arrIdx] : null
  }

  for (let i = len - 1; i >= Math.max(0, len - 30); i--) {
    const row = data[i]
    if (!row) continue
    
    // Price Change > +/- 5%
    let pctChg = row.pct_chg
    if (pctChg > 5) {
      events.push({ date: row.trade_date, reason: '大涨', pct_chg: pctChg, close: row.close })
    } else if (pctChg < -5) {
      events.push({ date: row.trade_date, reason: '大跌', pct_chg: pctChg, close: row.close })
    }

    // Volume Spike
    const vMa5 = getVal(volMa5, i, 4) // MA5 includes current? TI SMA usually includes current if passed slicing. 
    // TI SMA returns array of length (N - period + 1). Index 0 corresponds to data[period-1].
    // So data[i] corresponds to ma5[i - 4].
    if (vMa5 && row.vol > 3 * vMa5) {
       if (!events.find(e => e.date === row.trade_date)) {
         events.push({ date: row.trade_date, reason: '巨量', pct_chg: pctChg, close: row.close })
       }
    }
  }

  // Generate Signals for the Latest Day
  const lastIdx = len - 1
  const signals = generateSignals({
    close: adjCloses[lastIdx],
    open: data[lastIdx].open, // Use raw for K-shape
    high: data[lastIdx].high,
    low: data[lastIdx].low,
    vol: volumes[lastIdx],
    amount: amounts[lastIdx],
    pct_chg: data[lastIdx].pct_chg,
    
    ma5: getVal(ma5, lastIdx, 4),
    ma10: getVal(ma10, lastIdx, 9),
    ma20: getVal(ma20, lastIdx, 19),
    ma60: getVal(ma60, lastIdx, 59),
    
    macd: getVal(macd, lastIdx, 25),
    rsi: getVal(rsi, lastIdx, 14),
    kdj: getVal(kdj, lastIdx, 8),
    bb: getVal(bb, lastIdx, 19),
    atr: getVal(atr, lastIdx, 13),
    volatility: volatility[lastIdx - 1],
    volMa5: getVal(volMa5, lastIdx, 4)
  })

  // Latest status object
  const latest = {
    date: data[lastIdx].trade_date,
    close: data[lastIdx].close,
    pct_chg: data[lastIdx].pct_chg,
    
    ma5: getVal(ma5, lastIdx, 4),
    ma10: getVal(ma10, lastIdx, 9),
    ma20: getVal(ma20, lastIdx, 19),
    ma60: getVal(ma60, lastIdx, 59),
    
    rsi: getVal(rsi, lastIdx, 14),
    macd: getVal(macd, lastIdx, 25)?.MACD, 
    kdjK: getVal(kdj, lastIdx, 8)?.k,
    kdjD: getVal(kdj, lastIdx, 8)?.d,
    
    volatility: volatility[lastIdx - 1],
    
    signals // Attach signals
  }

  // Chart Data
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

  return { latest, events: events.slice(-10), chartData }
}

/**
 * 根据用户定义的逻辑生成交易信号
 */
function generateSignals(metrics) {
  const { 
    close, open, high, low, vol, amount, pct_chg,
    ma5, ma10, ma20, ma60,
    macd, rsi, kdj, bb, atr, volMa5 
  } = metrics

  const sigs = []
  const score = { bull: 0, bear: 0 }

  // 1. 均线系统 (Trend)
  if (ma5 && ma10 && ma20 && ma60) {
    if (ma5 > ma10 && ma10 > ma20 && ma20 > ma60) {
      sigs.push('均线多头排列 (强势上涨)')
      score.bull += 2
    } else if (ma5 < ma10 && ma10 < ma20 && ma20 < ma60) {
      sigs.push('均线空头排列 (下跌趋势)')
      score.bear += 2
    }
    
    if (close > ma60 && low <= ma60 * 1.01) {
       sigs.push('回踩生命线 (MA60) 支撑')
       score.bull += 1
    }
  }

  // 2. K线形态 (Sentiment)
  const body = Math.abs(close - open)
  const upperShadow = high - Math.max(close, open)
  const lowerShadow = Math.min(close, open) - low
  
  if (lowerShadow > body * 2 && lowerShadow > upperShadow) {
    sigs.push('长下影线 (下方支撑强)')
    score.bull += 0.5
  }
  
  // 3. 波段指标 (Oscillators)
  // RSI
  if (rsi > 80) {
    sigs.push(`RSI 超买 (${fmt(rsi)})`)
    score.bear += 1
  } else if (rsi < 20) {
    sigs.push(`RSI 超卖 (${fmt(rsi)})`)
    score.bull += 1
  }
  
  // MACD
  if (macd && macd.histogram > 0) {
     // 金叉判断需要前一天数据，这里简化：柱状图为正视为多头区域
     // sigs.push('MACD 多头区域') 
  }

  // 4. 量价关系
  // VWAP = (Amount * 10) / Vol (Amount:千元, Vol:手)
  const vwap = (vol > 0) ? (amount * 10) / vol : close
  if (close > vwap) {
    sigs.push('收盘站上均价线 (尾盘强势)')
    score.bull += 0.5
  } else {
    sigs.push('收盘跌破均价线 (抛压重)')
    score.bear += 0.5
  }
  
  if (volMa5 && vol > 1.5 * volMa5) {
     if (pct_chg > 0) {
       sigs.push('放量上涨')
       score.bull += 1
     } else {
       sigs.push('放量下跌')
       score.bear += 1
     }
  } else if (volMa5 && vol < 0.6 * volMa5 && pct_chg < 0) {
     sigs.push('缩量回调 (洗盘嫌疑)')
     score.bull += 0.5
  }

  // 5. 止损位 (ATR)
  const stopLoss = close - 2 * (atr || 0)

  // 综合决策
  let decision = '观望'
  if (score.bull > score.bear + 2) decision = '积极买入'
  else if (score.bull > score.bear) decision = '谨慎持有'
  else if (score.bear > score.bull + 2) decision = '清仓卖出'
  else if (score.bear > score.bull) decision = '减仓防守'

  return {
    signals: sigs,
    score,
    decision,
    stopLoss,
    vwap
  }
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
  const { decision, score, signals, stopLoss, vwap } = latest.signals || {}
  
  const prompt = `
你是一位精通量化交易与基本面分析的资深基金经理。请基于以下“数据+信息”对股票【${tsCode}】进行深度复盘与策略生成。

## 📊 第一部分：当前技术面特征 (数据引擎)
- **最新收盘**: ${fmt(latest.close)} (日期: ${latest.date}, 涨跌幅: ${fmt(latest.pct_chg)}%)
- **均线系统**: MA5=${fmt(latest.ma5)}, MA10=${fmt(latest.ma10)}, MA20=${fmt(latest.ma20)}, MA60=${fmt(latest.ma60)}
- **量价特征**: 成交量=${Math.round(latest.vol || 0)}手, 均价VWAP=${fmt(vwap)}
- **情绪指标**: RSI(14)=${fmt(latest.rsi)}, KDJ(9,3,3)=K:${fmt(latest.kdjK)}/D:${fmt(latest.kdjD)}
- **趋势指标**: MACD=${fmt(latest.macd)}
- **波动率**: 年化历史波动率=${latest.volatility ? fmt(latest.volatility * 100) : '-'}%, ATR止损位=${fmt(stopLoss)}

**量化信号诊断**:
- 综合评级: 【${decision}】 (多头得分:${score?.bull}, 空头得分:${score?.bear})
- 触发信号: ${signals?.join(', ') || '无明显异常信号'}

## 📰 第二部分：历史股性归因 (信息引擎)
这是该股过去几次大涨/大跌/巨量日期的当时新闻背景，请分析其“股性”：
${historyContext}

## 🌐 第三部分：今日实时情报
${todayContext}

## 🧠 第四部分：深度分析与策略 (决策引擎)
请严格按照以下 Markdown 格式输出分析报告：

📌 核心信息提炼
### 🔴 核心结论
[一句话给出明确的多空判断，必须结合量化评级【${decision}】和基本面]
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
### ♟️ 交易策略建议 (数学与实战融合)
请基于上述量化指标，构建两套互斥或互补的策略方案：

#### 方案一：[策略名称，如：均值回归/趋势跟随] (置信度: 高/中/低)
*   **数学逻辑**：[解释为什么选此策略，例如：当前股价偏离 MA20 超过 2个标准差，存在回归需求；或 ADX 显示趋势强度 > 25，适合动量策略]
*   **入场计划**：
    *   **触发条件**：[具体价格行为，如：回踩 MA20 不破且出现缩量阳线]
    *   **建议价格**：[基于 ATR 计算的区间，如：${fmt(latest.close - (latest.signals?.atr || 0) * 0.5)} ~ ${fmt(latest.close)}]
*   **风控系统**：
    *   **止损位**：${fmt(stopLoss)} (基于 2xATR 动态止损)
    *   **目标位**：[基于风险收益比 1:2 设定，即 Entry + 2 * (Entry - StopLoss)]
    *   **仓位建议**：[根据波动率 ${latest.volatility ? fmt(latest.volatility * 100) : '-'}% 建议，高波动低仓位]

#### 方案二：[备选策略，如：网格交易/突破追涨]
*   **适用场景**：[如：若方案一失效，或市场进入横盘震荡]
*   **操作逻辑**：...

#### 💡 资金管理与执行指令
*   **凯利公式视角**：[基于当前技术面胜率预估，建议单笔投入比例（保守/激进）]
*   **盘口博弈**：[关注 VWAP ${fmt(vwap)} 的得失，若盘中跌破...]
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
