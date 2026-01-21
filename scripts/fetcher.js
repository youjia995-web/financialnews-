const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })
const cron = require('node-cron')
const cls = require('../src/fetchers/cls')
// const futu = require('../src/fetchers/futu')
const eastmoney = require('../src/fetchers/eastmoney')
const wallstreetcn = require('../src/fetchers/wallstreetcn')
const tushare = require('../src/fetchers/tushare')
const { run } = require('../src/ai/generator')

async function refresh() {
  try {
    // 并行抓取
    const [count1, count2, count3] = await Promise.all([
      cls.runOnce().then(c => {
        console.log(`[fetcher] cls saved ${c} items`)
        return c
      }),
      // eastmoney.runOnce().then(c => {
      //   console.log(`[fetcher] eastmoney saved ${c} items`)
      //   return c
      // }),
      wallstreetcn.runOnce().then(c => {
        console.log(`[fetcher] wallstreetcn saved ${c} items`)
        return c
      })
    ])
    
    // const noted = await run(5)
    // console.log(`[fetcher] ai noted ${noted} items`)
  } catch (e) {
    console.error('[fetcher] error', e.message)
  }
}

if (process.argv.includes('--once')) {
  refresh().then(() => process.exit(0))
} else {
  console.log('[fetcher] start schedule */10 * * * *')
  // 启动时立即执行一次
  refresh()
  cron.schedule('*/10 * * * *', refresh)
  
  // 每天 17:00 同步 Tushare 股票数据
  console.log('[fetcher] start schedule 0 17 * * * for tushare')
  cron.schedule('0 17 * * *', () => {
    tushare.runDaily()
  })
}
