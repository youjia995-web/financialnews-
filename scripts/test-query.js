// scripts/test-query.js
const { analyzeQuery } = require('../src/ai/analyst')
const dotenv = require('dotenv')
dotenv.config()

async function runTest() {
  const query = "a 股内关于 cpu 的股票推荐哪些可以明天入手"
  console.log(`\n=== 开始测试智能问答流程 ===`)
  console.log(`❓ 问题: ${query}`)
  
  const start = Date.now()
  
  try {
    console.log(`\n--- 步骤 1: 调用 analyzeQuery ---`)
    const result = await analyzeQuery(query)
    
    const end = Date.now()
    console.log(`\n✅ 测试成功! 总耗时: ${((end - start) / 1000).toFixed(2)}s`)
    console.log(`\n📝 返回结果 (${result.length} chars):\n`)
    console.log(result.slice(0, 500) + '...') // 只打印前500字
  } catch (e) {
    const end = Date.now()
    console.error(`\n❌ 测试失败! 总耗时: ${((end - start) / 1000).toFixed(2)}s`)
    console.error(`🔴 错误信息:`, e)
    
    if (e.message.includes('DeepSeek API Error')) {
      console.error('\n🔍 诊断: DeepSeek API 调用失败，请检查 API Key 额度或服务状态。')
    } else if (e.message.includes('Tavily')) {
      console.error('\n🔍 诊断: Tavily 搜索失败，请检查网络或 API Key。')
    }
  }
}

runTest()
