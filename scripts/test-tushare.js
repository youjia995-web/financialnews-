// scripts/test-tushare.js
const { fetchHistory } = require('../src/fetchers/tushare')
const dotenv = require('dotenv')
dotenv.config()

async function runTest() {
  const symbol = '000657.SZ'
  console.log(`Fetching history for ${symbol}...`)
  
  try {
    const data = await fetchHistory(symbol, 150)
    console.log(`Fetched ${data.length} records.`)
    
    if (data.length > 0) {
      console.log('First record:', data[0])
      console.log('Last record:', data[data.length - 1])
    }
  } catch (e) {
    console.error('Fetch failed:', e)
  }
}

runTest()
