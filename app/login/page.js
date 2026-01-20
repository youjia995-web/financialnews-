'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    const res = await signIn('credentials', {
      username,
      password,
      redirect: false
    })

    if (res.error) {
      setError('Invalid credentials')
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      background: '#0f172a',
      color: 'white'
    }}>
      <form onSubmit={handleSubmit} style={{ 
        background: '#1e293b', 
        padding: '40px', 
        borderRadius: '8px', 
        width: '100%', 
        maxWidth: '400px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}>
        <h1 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold', textAlign: 'center' }}>登录</h1>
        
        {error && (
          <div style={{ 
            background: '#ef4444', 
            color: 'white', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>用户名</label>
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '4px', 
              border: '1px solid #334155',
              background: '#0f172a',
              color: 'white'
            }}
            required 
          />
        </div>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>密码</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '4px', 
              border: '1px solid #334155',
              background: '#0f172a',
              color: 'white'
            }}
            required 
          />
        </div>

        <button type="submit" style={{ 
          width: '100%', 
          padding: '12px', 
          borderRadius: '4px', 
          background: '#3b82f6', 
          color: 'white', 
          border: 'none', 
          cursor: 'pointer',
          fontWeight: 'bold'
        }}>
          登录
        </button>
      </form>
    </div>
  )
}
