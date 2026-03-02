// pages/Auth.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, api } from '../context/AuthContext'
import { Input, Btn, Alert, Textarea } from '../components/UI'

export default function Auth() {
  const [tab, setTab] = useState('login') // login | register | forgot
  const [fpTab, setFpTab] = useState('fuzzy') // fuzzy | message
  const { login, register } = useAuth()
  const navigate = useNavigate()

  // Login state
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginErr,  setLoginErr]  = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Register state
  const [regForm, setRegForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [regErr,  setRegErr]  = useState('')
  const [regLoading, setRegLoading] = useState(false)

  // Forgot-fuzzy state
  const [fuzzyForm, setFuzzyForm] = useState({ username: '', attempt: '' })
  const [fuzzyErr,  setFuzzyErr]  = useState('')
  const [fuzzyMsg,  setFuzzyMsg]  = useState('')
  const [fuzzyLoading, setFuzzyLoading] = useState(false)

  // Forgot-message state
  const [msgForm, setMsgForm] = useState({ email: '', message: '' })
  const [msgErr,  setMsgErr]  = useState('')
  const [msgOk,   setMsgOk]   = useState(false)
  const [msgLoading, setMsgLoading] = useState(false)

  /* ── Handlers ── */
  const handleLogin = async e => {
    e.preventDefault(); setLoginErr(''); setLoginLoading(true)
    try {
      const { mustChangePassword } = await login(loginForm.username, loginForm.password)
      navigate(mustChangePassword ? '/settings?changePassword=1' : '/')
    } catch (err) {
      setLoginErr(err.response?.data?.error || 'Login failed')
    } finally { setLoginLoading(false) }
  }

  const handleRegister = async e => {
    e.preventDefault(); setRegErr('')
    if (regForm.password !== regForm.confirm) { setRegErr('Passwords do not match'); return }
    setRegLoading(true)
    try {
      await register(regForm.username, regForm.email, regForm.password)
      navigate('/')
    } catch (err) {
      setRegErr(err.response?.data?.error || 'Registration failed')
    } finally { setRegLoading(false) }
  }

  const handleFuzzy = async e => {
    e.preventDefault(); setFuzzyErr(''); setFuzzyMsg(''); setFuzzyLoading(true)
    try {
      const r = await api.post('/api/auth/forgot-password/fuzzy', fuzzyForm)
      if (r.data.match) {
        // Log in with the token returned
        localStorage.setItem('bc_token', r.data.token)
        navigate('/settings?changePassword=1')
      } else {
        setFuzzyMsg('Password not recognised. Try the admin message option.')
      }
    } catch (err) {
      setFuzzyErr(err.response?.data?.error || 'Recovery failed')
    } finally { setFuzzyLoading(false) }
  }

  const handleMessage = async e => {
    e.preventDefault(); setMsgErr(''); setMsgLoading(true)
    try {
      await api.post('/api/auth/forgot-password/message', msgForm)
      setMsgOk(true)
    } catch (err) {
      setMsgErr(err.response?.data?.error || 'Failed to send message')
    } finally { setMsgLoading(false) }
  }

  /* ── Styles ── */
  const tabBtnStyle = (active) => ({
    padding: '9px 18px', fontFamily: '"DM Mono", monospace', fontSize: '0.75rem',
    background: active ? 'var(--accent-glow)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    border: 'none', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
  })

  const subTabStyle = (active) => ({
    ...tabBtnStyle(active), fontSize: '0.7rem', padding: '8px 14px',
  })

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-1px' }}>
            BioCube
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: '"DM Mono", monospace', marginTop: 4, textTransform: 'uppercase', letterSpacing: 2 }}>
            Smart Greenhouse Control
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
          {[['login','Sign In'],['register','Sign Up'],['forgot','Forgot']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ ...tabBtnStyle(tab === id), flex: 1 }}>{label}</button>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 32 }}>

          {/* ── LOGIN ── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {loginErr && <Alert type="danger">{loginErr}</Alert>}
              <Input label="Username" value={loginForm.username} onChange={e => setLoginForm(p => ({ ...p, username: e.target.value }))} placeholder="your_username" required />
              <Input label="Password" type="password" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" required />
              <Btn type="submit" disabled={loginLoading} style={{ width: '100%', marginTop: 8 }}>
                {loginLoading ? 'Signing in…' : 'Sign In'}
              </Btn>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>No account? <button type="button" onClick={() => setTab('register')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem' }}>Sign Up</button></span>
                <button type="button" onClick={() => setTab('forgot')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem' }}>Forgot password?</button>
              </div>
            </form>
          )}

          {/* ── REGISTER ── */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {regErr && <Alert type="danger">{regErr}</Alert>}
              <Input label="Username" value={regForm.username} onChange={e => setRegForm(p => ({ ...p, username: e.target.value }))} placeholder="choose_a_username" required />
              <Input label="Email" type="email" value={regForm.email} onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" required />
              <Input label="Password" type="password" value={regForm.password} onChange={e => setRegForm(p => ({ ...p, password: e.target.value }))} placeholder="min 6 characters" required />
              <Input label="Confirm Password" type="password" value={regForm.confirm} onChange={e => setRegForm(p => ({ ...p, confirm: e.target.value }))} placeholder="repeat password" required />
              <Btn type="submit" disabled={regLoading} style={{ width: '100%', marginTop: 8 }}>
                {regLoading ? 'Creating account…' : 'Create Account'}
              </Btn>
              <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Already have an account? <button type="button" onClick={() => setTab('login')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem' }}>Sign In</button>
              </div>
            </form>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {tab === 'forgot' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, fontFamily: '"Syne", sans-serif', marginBottom: 4 }}>Account Recovery</div>

              {/* Sub-tabs */}
              <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                <button onClick={() => setFpTab('fuzzy')} style={{ ...subTabStyle(fpTab === 'fuzzy'), flex: 1 }}>Try Old Password</button>
                <button onClick={() => setFpTab('message')} style={{ ...subTabStyle(fpTab === 'message'), flex: 1 }}>Message Admin</button>
              </div>

              {/* Fuzzy match */}
              {fpTab === 'fuzzy' && (
                <form onSubmit={handleFuzzy} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Alert type="info">Enter the password you remember. If it's close enough we'll let you in to change it.</Alert>
                  {fuzzyErr && <Alert type="danger">{fuzzyErr}</Alert>}
                  {fuzzyMsg && <Alert type="warning">{fuzzyMsg}</Alert>}
                  <Input label="Username" value={fuzzyForm.username} onChange={e => setFuzzyForm(p => ({ ...p, username: e.target.value }))} placeholder="your_username" required />
                  <Input label="Password you remember" type="password" value={fuzzyForm.attempt} onChange={e => setFuzzyForm(p => ({ ...p, attempt: e.target.value }))} placeholder="your old password" required />
                  <Btn type="submit" disabled={fuzzyLoading} style={{ width: '100%' }}>
                    {fuzzyLoading ? 'Checking…' : 'Try Recovery'}
                  </Btn>
                </form>
              )}

              {/* Message admin */}
              {fpTab === 'message' && (
                <form onSubmit={handleMessage} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {msgOk
                    ? <Alert type="success">Message sent! An admin will reset your password and email it to you.</Alert>
                    : <>
                        <Alert type="warning">An admin will manually reset your password and email it to you.</Alert>
                        {msgErr && <Alert type="danger">{msgErr}</Alert>}
                        <Input label="Your Email" type="email" value={msgForm.email} onChange={e => setMsgForm(p => ({ ...p, email: e.target.value }))} placeholder="account email address" required />
                        <Textarea label="Message to Admin" value={msgForm.message} onChange={e => setMsgForm(p => ({ ...p, message: e.target.value }))} placeholder="Briefly explain your situation…" rows={3} />
                        <Btn type="submit" disabled={msgLoading} style={{ width: '100%' }}>
                          {msgLoading ? 'Sending…' : 'Send Message'}
                        </Btn>
                      </>
                  }
                </form>
              )}

              <div style={{ textAlign: 'center' }}>
                <button onClick={() => setTab('login')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem' }}>← Back to login</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
