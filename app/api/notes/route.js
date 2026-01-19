import { NextResponse } from 'next/server'
import { run as runNotes } from '../../../src/ai/generator'

export async function POST() {
  try {
    const count = await runNotes(10)
    return NextResponse.json({ ok: true, count })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
