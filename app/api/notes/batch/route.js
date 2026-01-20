import { runBatch } from '../../../../src/ai/generator'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request) {
  try {
    const { ids } = await request.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json({ items: [] })
    }

    // 直接调用封装好的 runBatch
    const items = await runBatch(ids)
    
    return Response.json({ items })
  } catch (e) {
    console.error('Batch notes error:', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
