'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function UserManagement() {
  const { data: session } = useSession()
  const [users, setUsers] = useState([])
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'VISITOR' })
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Failed to fetch users', error)
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })
      const data = await res.json()
      if (res.ok) {
        setUsers([data, ...users])
        setNewUser({ username: '', password: '', role: 'VISITOR' })
        setMessage('用户创建成功')
      } else {
        setMessage(data.error || '创建失败')
      }
    } catch (error) {
      setMessage('请求失败')
    }
  }

  const handleDeleteUser = async (id) => {
    if (!confirm('确定要删除该用户吗？')) return
    
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id))
      } else {
        const data = await res.json()
        alert(data.error || '删除失败')
      }
    } catch (error) {
      alert('请求失败')
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: '#e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>用户管理</h1>
        <a href="/" style={{ color: '#3b82f6', textDecoration: 'none' }}>返回首页</a>
      </div>

      <div style={{ background: '#1e293b', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>添加新用户</h2>
        {message && <div style={{ marginBottom: '10px', color: message.includes('成功') ? '#4ade80' : '#ef4444' }}>{message}</div>}
        <form onSubmit={handleAddUser} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="用户名"
            value={newUser.username}
            onChange={e => setNewUser({ ...newUser, username: e.target.value })}
            required
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: 'white' }}
          />
          <input
            type="password"
            placeholder="密码"
            value={newUser.password}
            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
            required
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: 'white' }}
          />
          <select
            value={newUser.role}
            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: 'white' }}
          >
            <option value="VISITOR">访客</option>
            <option value="ADMIN">管理员</option>
          </select>
          <button type="submit" style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
            添加
          </button>
        </form>
      </div>

      <div style={{ background: '#1e293b', padding: '20px', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>用户列表</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #334155' }}>
              <th style={{ padding: '10px' }}>用户名</th>
              <th style={{ padding: '10px' }}>角色</th>
              <th style={{ padding: '10px' }}>创建时间</th>
              <th style={{ padding: '10px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '10px' }}>{user.username}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{ 
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    background: user.role === 'ADMIN' ? '#8b5cf6' : '#64748b',
                    color: 'white'
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '10px', fontSize: '14px', color: '#94a3b8' }}>
                  {new Date(parseInt(user.created_at)).toLocaleString()}
                </td>
                <td style={{ padding: '10px' }}>
                  {user.id !== session?.user?.id && (
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      style={{ padding: '4px 8px', background: '#ef4444', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                    >
                      删除
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
