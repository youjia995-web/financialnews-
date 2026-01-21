const prisma = require('./lib/prisma')
const { PythonShell } = require('python-shell')
const path = require('path')

async function test(code) {
  let tsCode = code
  if (/^\d{6}$/.test(code)) {
    const match = await prisma.stockDaily.findFirst({
      where: { ts_code: { startsWith: code } },
      select: { ts_code: true }
    })
    if (match) tsCode = match.ts_code
  }
  
  console.log(`Querying ${tsCode}...`)
  const history = await prisma.stockDaily.findMany({
    where: { ts_code: tsCode },
    orderBy: { trade_date: 'asc' }
  })
  
  console.log(`Found ${history.length} records.`)
  if (history.length > 0) {
    console.log('First:', history[0])
    console.log('Last:', history[history.length - 1])
  }

  // Run Python
  const pyshell = new PythonShell(path.join(process.cwd(), 'py/indicators.py'), {
    mode: 'text',
    pythonOptions: ['-u']
  })

  let output = ''
  pyshell.stdout.on('data', (chunk) => output += chunk)
  
  pyshell.send(JSON.stringify(history))
  pyshell.end((err) => {
    if (err) console.error('Python error:', err)
    try {
      const res = JSON.parse(output)
      console.log('Python Result Latest:', res.latest)
    } catch (e) {
      console.error('Parse error:', e, output)
    }
  })
}

test(process.argv[2] || '600000')
