import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/route"
import prisma from "../../../../../lib/prisma"

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params
  
  // Prevent deleting self
  if (session.user.id === id) {
     return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
  }

  try {
    await prisma.user.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
