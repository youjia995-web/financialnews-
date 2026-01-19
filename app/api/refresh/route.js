import { NextResponse } from 'next/server'
import cls from '../../../src/fetchers/cls'
// import futu from '../../../src/fetchers/futu'
import eastmoney from '../../../src/fetchers/eastmoney'
import { run as runNotes } from '../../../src/ai/generator'

export async function POST() {
  let count = 0
  let noted = 0
  
  try {
    // 1. 并行抓取新闻
    const [c1, c2] = await Promise.all([
      cls.runOnce(),
      eastmoney.runOnce()
    ])
    count = c1 + c2
  } catch (e) {
    console.error('Fetch news failed:', e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }

  /*
  try {
    // 2. 尝试生成评注，如果失败仅记录日志，不影响主流程
    noted = await runNotes(10)
  } catch (e) {
    console.error('Generate notes failed (ignored):', e)
    // 评注失败不视为接口失败
  }
  */

  return NextResponse.json({ ok: true, count, noted })
}
