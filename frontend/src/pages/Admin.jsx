// pages/Admin.jsx
import { useState, useEffect, useCallback } from 'react'
import { api } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'
import { Card, PageHeader, Btn, Badge, Alert } from '../components/UI'

function RoleBadge({ role }) {
  const map = { head_admin: 'warning', admin: 'info', user: 'muted' }
  return <Badge type={map[role] || 'muted'}>{role}</Badge>
}

export default function Admin({ sysStatus }) {
  const { user: me } = useAuth()
  const isHead = me?.role === 'head_admin'

  const [users,    setUsers]    = useState([])
  const [requests, setRequests] = useState([])
  const [tab,      setTab]      = useState('users')
  const [loading,  setLoading]  = useState(true)
  const [msg,      setMsg]      = useState({ type: '', text: '' })
  const [working,  setWorking]  = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [u, r] = await Promise.all([
        api.get('/api/admin/users'),
        api.get('/api/admin/password-requests'),
      ])
      setUsers(u.data)
      setRequests(r.data)
    } catch { setMsg({ type: 'danger', text: 'Failed to load admin data' }) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const act = async (action, userId, extra = {}) => {
    setWorking(p => ({ ...p, [`${action}-${userId}`]: true }))
    setMsg({ type: '', text: '' })
    try {
      let res
      if (action === 'ban')      res = await api.post(`/api/admin/ban/${userId}`)
      if (action === 'unban')    res = await api.post(`/api/admin/unban/${userId}`)
      if (action === 'delete')   res = await api.delete(`/api/admin/users/${userId}`)
      if (action === 'restrict') res = await api.post(`/api/admin/restrict/${userId}`, { restricted: extra.val })
      if (action === 'reset')    res = await api.post(`/api/admin/reset-password/${userId}`)
      if (action === 'promote')  res = await api.post(`/api/admin/promote/${userId}`, { role: extra.role })
      setMsg({ type: 'success', text: res.data.message || 'Done' })
      load()
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.error || 'Action failed' })
    } finally {
      setWorking(p => ({ ...p, [`${action}-${userId}`]: false }))
    }
  }

  const tabStyle = active => ({
    padding: '8px 20px', fontFamily: '"DM Mono", monospace', fontSize: '0.78rem',
    background: active ? 'var(--accent-glow)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    border: 'none', borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
    cursor: 'pointer', transition: 'all 0.15s',
  })

  return (
    <div className="fade-in">
      <PageHeader title="Admin" subtitle="User management and system oversight" />

      {/* System status cards */}
      <div className="bc-grid-auto" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Users', value: users.length },
          { label: 'Pending Resets', value: requests.length },
          { label: 'Arduino', value: sysStatus?.arduino ? 'Online' : 'Offline', accent: sysStatus?.arduino },
          { label: 'Raspberry Pi', value: sysStatus?.pi ? 'Online' : 'Offline', accent: sysStatus?.pi },
        ].map(({ label, value, accent }) => (
          <Card key={label} style={{ padding: 16 }}>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-muted)', fontFamily: '"DM Mono", monospace', marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '1.5rem', fontWeight: 500, color: accent !== undefined ? (accent ? 'var(--success)' : 'var(--danger)') : 'var(--text-primary)' }}>
              {value}
            </div>
          </Card>
        ))}
      </div>

      {msg.text && <Alert type={msg.type} style={{ marginBottom: 16 }}>{msg.text}</Alert>}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        <button style={tabStyle(tab === 'users')}    onClick={() => setTab('users')}>Users</button>
        <button style={tabStyle(tab === 'requests')} onClick={() => setTab('requests')}>
          Password Requests {requests.length > 0 && <span style={{ background: 'var(--danger)', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: '0.65rem', marginLeft: 6 }}>{requests.length}</span>}
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontFamily: '"DM Mono", monospace', fontSize: '0.85rem' }}>Loading…</div>
      ) : tab === 'users' ? (
        <Card style={{ overflowX: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Username', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text-muted)', fontFamily: '"DM Mono", monospace', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-glow)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{u.username} {u._id === me?._id && <Badge type="info">You</Badge>}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}><RoleBadge role={u.role} /></td>
                  <td style={{ padding: '12px 16px' }}>
                    {u.banned     && <Badge type="danger"  dot>Banned</Badge>}
                    {u.restricted && <Badge type="warning" dot>Restricted</Badge>}
                    {!u.banned && !u.restricted && <Badge type="success" dot>Active</Badge>}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: '"DM Mono", monospace' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {u._id !== me?._id && u.role !== 'head_admin' && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {isHead && (
                          <Btn size="sm" variant="ghost"
                            onClick={() => act('promote', u._id, { role: u.role === 'admin' ? 'user' : 'admin' })}
                            disabled={working[`promote-${u._id}`]}>
                            {u.role === 'admin' ? '↓ Demote' : '↑ Promote'}
                          </Btn>
                        )}
                        <Btn size="sm" variant="ghost"
                          onClick={() => act('restrict', u._id, { val: !u.restricted })}
                          disabled={working[`restrict-${u._id}`]}>
                          {u.restricted ? 'Unrestrict' : 'Restrict'}
                        </Btn>
                        <Btn size="sm" variant={u.banned ? 'secondary' : 'ghost'}
                          onClick={() => act(u.banned ? 'unban' : 'ban', u._id)}
                          disabled={working[`${u.banned ? 'unban' : 'ban'}-${u._id}`]}>
                          {u.banned ? 'Unban' : 'Ban'}
                        </Btn>
                        <Btn size="sm" variant="danger"
                          onClick={() => { if (confirm(`Delete ${u.username}?`)) act('delete', u._id) }}
                          disabled={working[`delete-${u._id}`]}>
                          Delete
                        </Btn>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        /* Password requests */
        requests.length === 0 ? (
          <Card>
            <div style={{ color: 'var(--text-muted)', fontFamily: '"DM Mono", monospace', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>
              No pending password reset requests.
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {requests.map(u => (
              <Card key={u._id}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontFamily: '"Syne", sans-serif', marginBottom: 4 }}>{u.username}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>{u.email}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 8, border: '1px solid var(--border)', maxWidth: 480 }}>
                      "{u.forgotPasswordMessage}"
                    </div>
                  </div>
                  <Btn onClick={() => act('reset', u._id)} disabled={working[`reset-${u._id}`]}>
                    {working[`reset-${u._id}`] ? 'Resetting…' : 'Reset & Email Password'}
                  </Btn>
                </div>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  )
}
