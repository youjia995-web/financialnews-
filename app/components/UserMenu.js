'use client'

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"

export default function UserMenu() {
  const { data: session } = useSession()

  if (session) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/analyst" style={{ fontSize: 14, color: '#facc15', textDecoration: 'none', fontWeight: 'bold' }}>
          AI分析官
        </Link>
        {session.user.role === 'ADMIN' && (
          <Link href="/admin/users" style={{ fontSize: 14, color: '#f472b6', textDecoration: 'none' }}>
            管理后台
          </Link>
        )}
        <span style={{ fontSize: 14, color: '#94a3b8' }}>{session.user.name || session.user.email}</span>
        <button 
          onClick={() => signOut()}
          style={{ 
            background: 'transparent', 
            border: '1px solid #334155', 
            color: '#cbd5e1', 
            padding: '4px 10px', 
            borderRadius: 6, 
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          退出
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Link href="/login" style={{ fontSize: 14, color: '#22d3ee', textDecoration: 'none' }}>登录</Link>
    </div>
  )
}
