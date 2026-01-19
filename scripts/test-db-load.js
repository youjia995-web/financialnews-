const { getNewsCol } = require('../lib/db-wrapper')
const fs = require('fs')
const path = require('path')

async function test() {
  const dbPath = path.join(process.cwd(), 'data.loki')
  
  console.log('--- Test 1: Normal load ---')
  try {
    const col = await getNewsCol()
    console.log('Success. Count:', col.count())
  } catch (e) {
    console.error('Failed:', e)
  }

  console.log('\n--- Test 2: File missing ---')
  // Rename existing db temporarily
  if (fs.existsSync(dbPath)) fs.renameSync(dbPath, dbPath + '.bak')
  
  try {
    const col = await getNewsCol()
    console.log('Success (should be empty). Count:', col.count())
  } catch (e) {
    console.error('Failed:', e)
  }

  console.log('\n--- Test 3: File corrupted ---')
  fs.writeFileSync(dbPath, 'invalid json content')
  try {
    const col = await getNewsCol()
    console.log('Success. Count:', col.count())
  } catch (e) {
    console.log('Expected failure caught:', e.message)
  }

  // Restore
  if (fs.existsSync(dbPath + '.bak')) {
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath)
    fs.renameSync(dbPath + '.bak', dbPath)
  }
}

test()