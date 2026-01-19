const { run } = require('../src/ai/generator')

async function main() {
  const limitArg = process.argv.find(a => a.startsWith('--limit='))
  const limit = limitArg ? Number(limitArg.split('=')[1]) : 10
  const c = await run(limit)
  console.log(`[notes] generated ${c}`)
}

main()
