'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'USER', name: '' })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    if (!newUser.username || !newUser.password) return alert('用户名和密码必填')

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })
      
      if (res.ok) {
        setShowAddModal(false)
        setNewUser({ username: '', password: '', role: 'USER', name: '' })
        fetchUsers() // 重新获取列表
      } else {
        const json = await res.json()
        alert(json.error || '创建失败')
      }
    } catch (e) {
      alert('创建失败')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除该用户吗？')) return
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id))
      } else {
        alert('删除失败')
      }
    } catch (e) {
      alert('操作失败')
    }
  }

  const handleRoleChange = async (id, currentRole) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN'
    if (!confirm(`确定将该用户角色修改为 ${newRole} 吗？`)) return
    
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })
      if (res.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u))
      } else {
        alert('修改失败')
      }
    } catch (e) {
      alert('操作失败')
    }
  }

  if (loading) return <div style={{ padding: 40, color: '#94a3b8' }}>加载中...</div>

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#e2e8f0', padding: 24 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 'bold' }}>用户管理</h1>
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              onClick={() => setShowAddModal(true)}
              style={{ background: '#22d3ee', color: '#0f172a', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}
            >
              + 添加用户
            </button>
            <Link href="/" style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>返回首页</Link>
          </div>
        </div>

        {showAddModal && (
          <div style={{ marginBottom: 24, background: '#1e293b', padding: 20, borderRadius: 8, border: '1px solid #334155' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>添加新用户</h3>
            <form onSubmit={handleAddUser} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <input 
                placeholder="用户名 (必填)" 
                value={newUser.username} 
                onChange={e => setNewUser({...newUser, username: e.target.value})}
                style={{ padding: 8, borderRadius: 4, background: '#0f172a', border: '1px solid #475569', color: 'white' }}
              />
              <input 
                placeholder="密码 (必填)" 
                type="password"
                value={newUser.password} 
                onChange={e => setNewUser({...newUser, password: e.target.value})}
                style={{ padding: 8, borderRadius: 4, background: '#0f172a', border: '1px solid #475569', color: 'white' }}
              />
              <input 
                placeholder="姓名 (选填)" 
                value={newUser.name} 
                onChange={e => setNewUser({...newUser, name: e.target.value})}
                style={{ padding: 8, borderRadius: 4, background: '#0f172a', border: '1px solid #475569', color: 'white' }}
              />
              <select 
                value={newUser.role}
                onChange={e => setNewUser({...newUser, role: e.target.value})}
                style={{ padding: 8, borderRadius: 4, background: '#0f172a', border: '1px solid #475569', color: 'white' }}
              >
                <option value="USER">普通用户</option>
                <option value="ADMIN">管理员</option>
              </select>
              <button type="submit" style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>保存</button>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ background: '#64748b', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>取消</button>
            </form>
          </div>
        )}

        <div style={{ background: '#1e293b', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#334155', textAlign: 'left' }}>
                <th style={{ padding: 12 }}>用户名</th>
                <th style={{ padding: 12 }}>姓名</th>
                <th style={{ padding: 12 }}>角色</th>
                <th style={{ padding: 12 }}>注册时间</th>
                <th style={{ padding: 12 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderTop: '1px solid #334155' }}>
                  <td style={{ padding: 12 }}>{user.username}</td>
                  <td style={{ padding: 12 }}>{user.name || '-'}</td>
                  <td style={{ padding: 12 }}>
                    <span style={{ 
                      background: user.role === 'ADMIN' ? '#db2777' : '#2563eb',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 12
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}>{new Date(user.createdAt).toLocaleString()}</td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        onClick={() => handleRoleChange(user.id, user.role)}
                        style={{ 
                          background: 'transparent', 
                          border: '1px solid #94a3b8', 
                          color: '#94a3b8', 
                          cursor: 'pointer',
                          padding: '2px 8px',
                          borderRadius: 4
                        }}
                      >
                        {user.role === 'ADMIN' ? '降级' : '设为管理员'}
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        style={{ 
                          background: 'transparent', 
                          border: '1px solid #ef4444', 
                          color: '#ef4444', 
                          cursor: 'pointer',
                          padding: '2px 8px',
                          borderRadius: 4
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
