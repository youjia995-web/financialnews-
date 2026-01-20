'use client'
import { useSession, signIn, signOut } from "next-auth/react"
import Link from "next/link"

export default function UserNav() {
  const { data: session } = useSession()

  if (session) {
    return (
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', color: '#cbd5e1' }}>
          {session.user.name}
        </span>
        {session.user.role === 'ADMIN' && (
          <Link href="/admin/users" style={{ color: '#3b82f6', fontSize: '14px', textDecoration: 'none' }}>
            管理
          </Link>
        )}
        <button 
          onClick={() => signOut()}
          style={{ 
            background: '#334155', 
            border: 'none', 
            color: 'white', 
            padding: '4px 8px', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          退出
        </button>
      </div>
    )
  }

  return (
    <button 
      onClick={() => signIn()}
      style={{ 
        background: '#3b82f6', 
        border: 'none', 
        color: 'white', 
        padding: '6px 12px', 
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px'
      }}
    >
      登录
    </button>
  )
}
