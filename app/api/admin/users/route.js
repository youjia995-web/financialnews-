import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import prisma from "../../../../lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(request) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const users = await prisma.user.findMany({
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      username: true,
      role: true,
      created_at: true
    }
  })

  // Convert BigInt to string
  const safeUsers = users.map(user => ({
    ...user,
    created_at: user.created_at.toString()
  }))

  return NextResponse.json(safeUsers)
}

export async function POST(request) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { username, password, role } = await request.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const existingUser = await prisma.user.findUnique({
    where: { username }
  })

  if (existingUser) {
    return NextResponse.json({ error: 'User already exists' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const newUser = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      role: role || 'VISITOR',
      created_at: BigInt(Date.now())
    }
  })

  return NextResponse.json({
    id: newUser.id,
    username: newUser.username,
    role: newUser.role,
    created_at: newUser.created_at.toString()
  })
}
