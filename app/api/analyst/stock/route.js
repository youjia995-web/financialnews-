import { NextResponse } from 'next/server'
import analyst from "../../../../src/ai/analyst"

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(req) {
  // const session = await getServerSession(authOptions)
  // if (!session) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // }

  try {
    const { code } = await req.json()
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const result = await analyst.analyzeStock(code)
    return NextResponse.json({ result })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
