const prisma = require('../../lib/prisma')
const qwen = require('./qwen')
const deepseek = require('./deepseek')
const tavily = require('../tools/tavily')
const { PythonShell } = require('python-shell')
const path = require('path')

// 格式化数字
const fmt = (n) => typeof n === 'number' ? n.toFixed(2) : '-'

/**
 * 调用 Python 脚本计算指标
 */
function runPythonIndicators(data) {
  return new Promise((resolve, reject) => {
    const pyshell = new PythonShell(path.join(process.cwd(), 'py/indicators.py'), {
      mode: 'text',
      pythonOptions: ['-u']
    })

    let output = ''
    pyshell.stdout.on('data', (chunk) => {
      output += chunk
    })

    pyshell.send(JSON.stringify(data))
    pyshell.end((err, code, signal) => {
      if (err) return reject(err)
      try {
        resolve(JSON.parse(output))
      } catch (e) {
        reject(new Error('Failed to parse Python output: ' + output))
      }
    })
  })
}

/**
 * 功能 1: 个股深度诊断 (Qwen-Max) - 三引擎驱动版
 */
async function analyzeStock(code) {
  // 1. 模糊匹配股票代码
  let tsCode = code
  if (/^\d{6}$/.test(code)) {
    const match = await prisma.stockDaily.findFirst({
      where: { ts_code: { startsWith: code } },
      select: { ts_code: true }
    })
    if (match) tsCode = match.ts_code
  }

  // 2. [数据引擎] 获取全量历史数据并计算特征
  // 注意：为了性能，这里只取最近 1000 条（约4年），足够计算指标
  const history = await prisma.stockDaily.findMany({
    where: { ts_code: tsCode },
    orderBy: { trade_date: 'asc' },
    // take: 1000 // 如果需要更长周期可调整
  })

  if (history.length === 0) {
    throw new Error(`未找到股票 ${tsCode} 的历史数据`)
  }

  // 调用 Python 计算指标和筛选关键日期
  let indicators
  try {
    indicators = await runPythonIndicators(history)
  } catch (e) {
    console.error('Python calculation failed:', e)
    // Fallback: 如果 Python 失败，手动构建简单数据
    indicators = {
      latest: { close: history[history.length-1].close },
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
- **波动率**: 年化历史波动率=${fmt(latest.volatility * 100)}%

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
  return await qwen.generate(prompt, { temperature: 0.4 })
}

/**
 * 功能 2: 智能财经问答 (DeepSeek)
 */
async function analyzeQuery(query) {
  // 1. Tavily 搜索
  const searchRes = await tavily.search(query)
  const webContext = searchRes?.results?.map(r => `[${r.title}] ${r.content}`).join('\n') || ''

  // 2. 本地财经新闻聚合 (最近 24 小时, 取最新的 20 条)
  const yesterday = BigInt(Date.now() - 24 * 60 * 60 * 1000)
  const localNews = await prisma.news.findMany({
    where: { published_at: { gte: yesterday } },
    orderBy: { published_at: 'desc' },
    take: 20,
    select: { title: true, brief: true }
  })
  const localContext = localNews.map(n => `[快讯] ${n.title}: ${n.brief}`).join('\n')

  // 3. 构建 Prompt
  const messages = [
    { role: 'system', content: '你是一位博学的财经专家，擅长结合实时网络信息和市场快讯回答用户问题。回答要条理清晰，引用数据支持。' },
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
  return await deepseek.chat(messages, { temperature: 0.5, max_tokens: 2000 })
}

module.exports = { analyzeStock, analyzeQuery }
