import { NextResponse } from 'next/server'
import { generateReport } from '../../../src/intelligence/processor'
import prisma from '../../../lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5分钟超时，因为分析可能很慢

export async function POST(request) {
  try {
    const { start, end } = await request.json()
    
    if (!start || !end) {
      return NextResponse.json({ error: 'Missing start or end time' }, { status: 400 })
    }

    const report = await generateReport(start, end)
    
    // 序列化 BigInt
    const safeReport = {
      ...report,
      id: report.id,
      start_time: Number(report.start_time),
      end_time: Number(report.end_time),
      content: report.content,
      created_at: Number(report.created_at)
    }

    return NextResponse.json({ ok: true, report: safeReport })
  } catch (e) {
    console.error('[api/intelligence] error:', e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

// 获取历史报告列表
export async function GET(request) {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { created_at: 'desc' },
      take: 10
    })

    const safeReports = reports.map(r => ({
      id: r.id,
      start_time: Number(r.start_time),
      end_time: Number(r.end_time),
      content: r.content,
      created_at: Number(r.created_at)
    }))

    return NextResponse.json({ ok: true, reports: safeReports })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
