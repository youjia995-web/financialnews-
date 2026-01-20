const prisma = require('../../lib/prisma')
const { generate } = require('../ai/qwen')

// 计算 Levenshtein 距离的简单实现
function levenshtein(a, b) {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  const matrix = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  return matrix[b.length][a.length]
}

/**
 * 新闻去重
 * @param {Array} items 
 * @returns {Array} 去重后的 items
 */
function deduplicate(items) {
  const uniqueItems = []
  // 按时间倒序，优先保留最新的
  const sorted = [...items].sort((a, b) => Number(b.published_at) - Number(a.published_at))
  
  for (const item of sorted) {
    let isDuplicate = false
    for (const unique of uniqueItems) {
      // 1. 标题完全相同
      if (item.title === unique.title) {
        isDuplicate = true
        break
      }
      // 2. 标题高度相似 (Levenshtein 距离 / 较长标题长度 < 0.3，即相似度 > 70%)
      const dist = levenshtein(item.title, unique.title)
      const maxLen = Math.max(item.title.length, unique.title.length)
      if (maxLen > 5 && dist / maxLen < 0.3) {
        isDuplicate = true
        break
      }
    }
    if (!isDuplicate) {
      uniqueItems.push(item)
    }
  }
  return uniqueItems
}

/**
 * 分治分析策略
 */
async function mapReduceAnalyze(items) {
  // 1. Map 阶段：分块提取要点
  const CHUNK_SIZE = 20
  const chunks = []
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    chunks.push(items.slice(i, i + CHUNK_SIZE))
  }

  console.log(`[intelligence] Processing ${items.length} items in ${chunks.length} chunks...`)

  const mapResults = await Promise.all(chunks.map(async (chunk, idx) => {
    const content = chunk.map(it => `- [${new Date(Number(it.published_at)).toLocaleTimeString()}] ${it.title} (摘要:${it.brief || ''})`).join('\n')
    const prompt = `
请分析以下一组财经新闻，提取关键信息：
1. 核心事件（去重后的重要事实）
2. 市场情绪（利好/利空/中性）
3. 涉及板块

新闻列表：
${content}

请输出简练的总结。
`
    try {
      return await generate(prompt)
    } catch (e) {
      console.error(`[intelligence] Chunk ${idx} failed:`, e)
      return null
    }
  }))

  const validResults = mapResults.filter(Boolean).join('\n\n---\n\n')

  // 2. Reduce 阶段：汇总分析
  console.log('[intelligence] Generating final report...')
  const finalPrompt = `
你是一位资深的“AI财经情报官”。基于以下分段整理的财经新闻摘要，请撰写一份结构清晰、深度洞察的全天财经情报研报。

输入素材：
${validResults}

请严格按照以下 Markdown 格式输出：

# 📊 AI 财经全天情报 ([日期])

## 1. 宏观情绪温度计
[用一句话概括全天市场情绪，例如：多空博弈激烈，避险情绪升温]
- **情绪指数**：[0-100打分，0极度恐慌，100极度贪婪]
- **核心驱动**：[列出影响情绪的1-2个关键因子]

## 2. 全天脉络梳理
[按时间线或逻辑线，梳理全天发生的3-5个关键转折点或大事件]
- ⏰ [时间] **[事件标题]**：[简要解读及影响]
...

## 3. 板块轮动推演
[分析资金流向和板块强弱变化]
- 🔥 **强势板块**：[板块名] - [上涨逻辑]
- 🧊 **弱势板块**：[板块名] - [下跌原因]
- 🔄 **轮动预期**：[预测下一个可能的轮动方向]

## 4. 💡 操盘策略建议
[给出具体的操作建议，如仓位控制、方向选择]
- **短线**：...
- **中长线**：...
- **风险提示**：...

(注：以上内容基于新闻面分析生成，仅供参考，不构成投资建议)
`

  return await generate(finalPrompt, { max_tokens: 3000 })
}

/**
 * 生成报告入口
 */
async function generateReport(startTime, endTime) {
  // 1. 查询数据
  const items = await prisma.news.findMany({
    where: {
      published_at: {
        gte: BigInt(startTime),
        lte: BigInt(endTime)
      }
    },
    orderBy: { published_at: 'asc' } // 按时间正序方便阅读
  })

  if (items.length === 0) {
    throw new Error('该时间段内无新闻数据')
  }

  // 2. 去重
  const uniqueItems = deduplicate(items)
  console.log(`[intelligence] Deduplicated: ${items.length} -> ${uniqueItems.length}`)

  // 3. 分析生成
  const reportContent = await mapReduceAnalyze(uniqueItems)
  if (!reportContent) {
    throw new Error('报告生成失败')
  }

  // 4. 保存报告
  const report = await prisma.report.create({
    data: {
      start_time: BigInt(startTime),
      end_time: BigInt(endTime),
      content: reportContent,
      created_at: BigInt(Date.now())
    }
  })

  return report
}

module.exports = { generateReport }
