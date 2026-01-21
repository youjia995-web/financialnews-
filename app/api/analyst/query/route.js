import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import analyst from "../../../../src/ai/analyst"

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { query } = await req.json()
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const result = await analyst.analyzeQuery(query)
    
    if (!result) {
      console.error('Analyst returned empty result for query:', query)
      return NextResponse.json({ error: 'AI 未返回任何内容，请重试' }, { status: 500 })
    }

    return NextResponse.json({ result })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
