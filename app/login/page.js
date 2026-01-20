'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await signIn('credentials', {
      redirect: false,
      username,
      password
    })

    if (res?.error) {
      setError('登录失败，请检查用户名和密码')
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1e293b', padding: 32, borderRadius: 12, width: '100%', maxWidth: 400 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' }}>登录 Huoking News</h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="text"
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: 12, borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: 'white' }}
            required
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: 12, borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: 'white' }}
            required
          />
          {error && <div style={{ color: '#ef4444', fontSize: 14 }}>{error}</div>}
          <button type="submit" style={{ padding: 12, borderRadius: 6, background: '#22d3ee', color: '#0f172a', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
            登录
          </button>
        </form>
      </div>
    </div>
  )
}
