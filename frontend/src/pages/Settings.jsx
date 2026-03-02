// pages/Settings.jsx
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'
import { Card, PageHeader, Btn, Input, Alert, Badge } from '../components/UI'

const THEMES = [
  { id: 'default',   label: 'Default',    desc: 'Deep Forest Lab' },
  { id: 'slate',     label: 'Slate',      desc: 'Deep Space' },
  { id: 'light',     label: 'Light',      desc: 'Greenhouse Glass' },
  { id: 'amber',     label: 'Amber',      desc: 'Warm Harvest' },
  { id: 'sunflower', label: '🌻 Sunflower', desc: 'Secret Garden' },
  { id: 'retro',     label: '⣿ Retro',    desc: 'CRT Terminal' },
  { id: 'undertale', label: '❤ Undertale', desc: 'DETERMINATION' },
  { id: 'pvz',       label: '🌻 PvZ',     desc: 'Suburban Jungle' },
]

export default function Settings() {
  const { user, refreshUser, setTheme, theme, logout } = useAuth()
  const [searchParams] = useSearchParams()
  const mustChange = searchParams.get('changePassword') === '1'

  // Username
  const [username,   setUsername]   = useState(user?.username || '')
  const [unameMsg,   setUnameMsg]   = useState({ type: '', text: '' })
  const [unameSaving,setUnameSaving]= useState(false)

  // Password
  const [pwForm,     setPwForm]     = useState({ current: '', newPw: '', confirm: '' })
  const [pwMsg,      setPwMsg]      = useState({ type: '', text: mustChange ? 'You must set a new password before continuing.' : '' })
  const [pwSaving,   setPwSaving]   = useState(false)

  // Logout everywhere
  const [logoutMsg,  setLogoutMsg]  = useState({ type: '', text: '' })
  const [logoutBusy, setLogoutBusy] = useState(false)

  // Sunflower counter (secret)
  const [sfClicks,   setSfClicks]   = useState(0)
  const [sfBloom,    setSfBloom]    = useState(false)

  useEffect(() => {
    if (mustChange) setPwMsg({ type: 'warning', text: 'Your password was reset by an admin. Please set a new password.' })
  }, [mustChange])

  const saveUsername = async e => {
    e.preventDefault()
    setUnameSaving(true); setUnameMsg({ type: '', text: '' })
    try {
      await api.patch('/api/settings/username', { username })
      await refreshUser()
      setUnameMsg({ type: 'success', text: 'Username updated!' })
    } catch (err) {
      setUnameMsg({ type: 'danger', text: err.response?.data?.error || 'Failed' })
    } finally { setUnameSaving(false) }
  }

  const savePassword = async e => {
    e.preventDefault()
    if (pwForm.newPw !== pwForm.confirm) { setPwMsg({ type: 'danger', text: 'Passwords do not match' }); return }
    setPwSaving(true); setPwMsg({ type: '', text: '' })
    try {
      await api.post('/api/auth/change-password', { newPassword: pwForm.newPw, currentPassword: pwForm.current })
      setPwMsg({ type: 'success', text: 'Password changed! All other sessions have been logged out.' })
      setPwForm({ current: '', newPw: '', confirm: '' })
    } catch (err) {
      setPwMsg({ type: 'danger', text: err.response?.data?.error || 'Failed' })
    } finally { setPwSaving(false) }
  }

  const handleLogoutEverywhere = async () => {
    setLogoutBusy(true); setLogoutMsg({ type: '', text: '' })
    try {
      await api.post('/api/auth/logout-everywhere')
      setLogoutMsg({ type: 'success', text: 'All other sessions have been logged out.' })
    } catch {
      setLogoutMsg({ type: 'danger', text: 'Failed to logout all sessions' })
    } finally { setLogoutBusy(false) }
  }

  const handleSunflower = () => {
    setSfClicks(n => {
      const next = n + 1
      if (next >= 5) {
        setTheme('sunflower')
        setSfBloom(true)
        setTimeout(() => setSfBloom(false), 700)
        return 0
      }
      return next
    })
    setSfBloom(true)
    setTimeout(() => setSfBloom(false), 400)
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Settings"
        subtitle={`Logged in as ${user?.username}`}
        actions={<Badge type={user?.role === 'head_admin' ? 'warning' : user?.role === 'admin' ? 'info' : 'muted'}>{user?.role}</Badge>}
      />

      {mustChange && (
        <Alert type="warning" style={{ marginBottom: 24 }}>
          ⚠ Your password was reset by an admin. You must set a new password before you can use the system.
        </Alert>
      )}

      {/* Theme picker */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: '"Syne", sans-serif', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          Theme
          {/* Sunflower easter egg */}
          <span
            onClick={handleSunflower}
            title={sfClicks > 0 ? `${5 - sfClicks} more…` : '?'}
            style={{
              cursor: 'pointer', fontSize: '1.2rem', display: 'inline-block',
              transition: 'transform 0.3s',
              animation: sfBloom ? 'sunflower-bloom 0.4s ease' : 'none',
            }}>🌻</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              style={{
                padding: '12px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                border: `1px solid ${theme === t.id ? 'var(--accent)' : 'var(--border)'}`,
                background: theme === t.id ? 'var(--accent-glow)' : 'var(--bg-input)',
                transition: 'all 0.15s',
              }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 500, color: theme === t.id ? 'var(--accent)' : 'var(--text-primary)', marginBottom: 3 }}>{t.label}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: '"DM Mono", monospace' }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Username */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: '"Syne", sans-serif', fontWeight: 600, marginBottom: 16 }}>Change Username</div>
        {unameMsg.text && <Alert type={unameMsg.type} style={{ marginBottom: 12 }}>{unameMsg.text}</Alert>}
        <form onSubmit={saveUsername} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Input label="New Username" value={username} onChange={e => setUsername(e.target.value)} placeholder="new_username" required />
          </div>
          <Btn type="submit" disabled={unameSaving || username === user?.username}>
            {unameSaving ? 'Saving…' : 'Save Username'}
          </Btn>
        </form>
      </Card>

      {/* Password */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: '"Syne", sans-serif', fontWeight: 600, marginBottom: 16 }}>Change Password</div>
        {pwMsg.text && <Alert type={pwMsg.type || 'info'} style={{ marginBottom: 12 }}>{pwMsg.text}</Alert>}
        <form onSubmit={savePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400 }}>
          {!mustChange && (
            <Input label="Current Password" type="password" value={pwForm.current}
              onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} placeholder="••••••••" required />
          )}
          <Input label="New Password" type="password" value={pwForm.newPw}
            onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))} placeholder="min 6 characters" required />
          <Input label="Confirm New Password" type="password" value={pwForm.confirm}
            onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} placeholder="repeat new password" required />
          <Btn type="submit" disabled={pwSaving}>
            {pwSaving ? 'Saving…' : 'Change Password'}
          </Btn>
        </form>
      </Card>

      {/* Sessions */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: '"Syne", sans-serif', fontWeight: 600, marginBottom: 8 }}>Sessions</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          Log out of all other devices. Your current session will remain active.
        </div>
        {logoutMsg.text && <Alert type={logoutMsg.type} style={{ marginBottom: 12 }}>{logoutMsg.text}</Alert>}
        <Btn variant="secondary" onClick={handleLogoutEverywhere} disabled={logoutBusy}>
          {logoutBusy ? 'Logging out…' : 'Logout Everywhere'}
        </Btn>
      </Card>

      {/* Account info */}
      <Card>
        <div style={{ fontFamily: '"Syne", sans-serif', fontWeight: 600, marginBottom: 12 }}>Account Info</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: '"DM Mono", monospace', fontSize: '0.82rem' }}>
          {[
            ['Username', user?.username],
            ['Email',    user?.email],
            ['Role',     user?.role],
            ['Member since', user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', gap: 16 }}>
              <span style={{ color: 'var(--text-muted)', minWidth: 120 }}>{label}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{val}</span>
            </div>
          ))}
        </div>
      </Card>

      <style>{`
        @keyframes sunflower-bloom {
          0%   { transform: rotate(0deg) scale(1); }
          50%  { transform: rotate(180deg) scale(1.6); }
          100% { transform: rotate(360deg) scale(1); }
        }
      `}</style>
    </div>
  )
}
