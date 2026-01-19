import { NextResponse } from 'next/server'
import { runBatch } from '../../../../src/ai/generator'

export async function POST(req) {
  try {
    const { ids } = await req.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ ok: false, error: 'Invalid ids' }, { status: 400 })
    }

    // 批量生成
    const items = await runBatch(ids)
    
    // 返回更新后的条目，供前端局部刷新
    return NextResponse.json({ ok: true, items })
  } catch (e) {
    console.error('Batch note error:', e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
