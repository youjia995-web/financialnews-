import { NextResponse } from 'next/server'
import prisma from '../../../../../lib/prisma'
import { getServerSession } from "next-auth/next"
import { GET as authOptions } from "../../../auth/[...nextauth]/route"

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return false
  }
  return true
}

export async function DELETE(req, { params }) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    await prisma.user.delete({
      where: { id: params.id }
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req, { params }) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { role } = body
    
    if (!['USER', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { role }
    })
    return NextResponse.json({ ok: true, user })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
