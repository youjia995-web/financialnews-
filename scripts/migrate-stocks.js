const fs = require('fs')
const readline = require('readline')
const path = require('path')
const prisma = require('../lib/prisma')

async function migrate() {
  const csvPath = path.join(__dirname, '../stocks.csv')
  if (!fs.existsSync(csvPath)) {
    console.error('stocks.csv not found!')
    process.exit(1)
  }

  const fileStream = fs.createReadStream(csvPath)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })

  let headers = []
  let buffer = []
  const BATCH_SIZE = 1000
  let count = 0

  console.log('Start migration...')

  for await (const line of rl) {
    if (!headers.length) {
      headers = line.split(',')
      continue
    }

    const cols = line.split(',')
    const row = {}
    headers.forEach((h, i) => row[h] = cols[i])

    // Transform
    // symbol: sh600070 -> 600070.SH
    let ts_code = row.symbol
    if (ts_code.startsWith('sh')) {
      ts_code = ts_code.substring(2) + '.SH'
    } else if (ts_code.startsWith('sz')) {
      ts_code = ts_code.substring(2) + '.SZ'
    } else if (ts_code.startsWith('bj')) {
      ts_code = ts_code.substring(2) + '.BJ'
    }

    // date: 2025-01-02 -> 20250102
    const trade_date = row.date.replace(/-/g, '')

    // amount: Yuan -> Thousand Yuan
    const amount = parseFloat(row.amount) / 1000

    buffer.push({
      ts_code,
      trade_date,
      open: parseFloat(row.open),
      high: parseFloat(row.high),
      low: parseFloat(row.low),
      close: parseFloat(row.close),
      vol: parseFloat(row.volume),
      amount: amount
    })

    if (buffer.length >= BATCH_SIZE) {
      await saveBatch(buffer)
      count += buffer.length
      console.log(`Migrated ${count} rows...`)
      buffer = []
    }
  }

  if (buffer.length > 0) {
    await saveBatch(buffer)
    count += buffer.length
  }

  console.log(`Migration finished! Total ${count} rows.`)
  await prisma.$disconnect()
}

async function saveBatch(data) {
  // Use createMany with skipDuplicates
  await prisma.stockDaily.createMany({
    data,
    skipDuplicates: true
  })
}

migrate().catch(e => {
  console.error(e)
  process.exit(1)
})
