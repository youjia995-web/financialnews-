const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })
const cron = require('node-cron')
const cls = require('../src/fetchers/cls')
// const futu = require('../src/fetchers/futu')
const eastmoney = require('../src/fetchers/eastmoney')
const { run } = require('../src/ai/generator')

async function refresh() {
  try {
    // 并行抓取
    const [count1, count2] = await Promise.all([
      cls.runOnce().then(c => {
        console.log(`[fetcher] cls saved ${c} items`)
        return c
      }),
      eastmoney.runOnce().then(c => {
        console.log(`[fetcher] eastmoney saved ${c} items`)
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
  cron.schedule('*/10 * * * *', refresh)
}
