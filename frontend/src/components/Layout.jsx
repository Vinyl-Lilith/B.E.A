// components/Layout.jsx — mobile responsive with hamburger drawer
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { StatusDot } from './UI'

const THEMES = [
  { id: 'default',   label: 'Default' },
  { id: 'slate',     label: 'Slate' },
  { id: 'light',     label: 'Light' },
  { id: 'amber',     label: 'Amber' },
  { id: 'sunflower', label: '🌻' },
  { id: 'retro',     label: '⣿ Retro' },
  { id: 'undertale', label: '❤ UT' },
  { id: 'pvz',       label: '🌻 PvZ' },
]

function NavIcon({ d }) {
  return (
    <svg width={18} height={18} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  )
}

const NAV = [
  { to: '/',           label: 'Home',       icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', section: 'Monitor' },
  { to: '/automation', label: 'Automation', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4', section: 'Control' },
  { to: '/manual',     label: 'Manual',     icon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5', section: null },
  { to: '/admin',      label: 'Admin',      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', section: 'System', adminOnly: true },
  { to: '/settings',   label: 'Settings',   icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', section: null },
]

export default function Layout({ children, sysStatus = {} }) {
  const { user, logout, theme, setTheme } = useAuth()
  const navigate = useNavigate()
  const [showThemes, setShowThemes] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isAdmin = user?.role === 'admin' || user?.role === 'head_admin'

  const navStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 24px', fontSize: '0.9rem', fontWeight: 500,
    borderLeft: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
    background: isActive ? 'var(--accent-glow)' : 'transparent',
    textDecoration: 'none', transition: 'all 0.15s', cursor: 'pointer',
  })

  const SidebarContent = ({ onNav }) => {
    let ls = null
    return (
      <>
        {/* Logo */}
        <div style={{ padding: '0 24px 20px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
          <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.5px' }}>BioCube</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, fontFamily: '"DM Mono", monospace' }}>Smart Greenhouse</div>
        </div>

        {/* System status */}
        <div style={{ padding: '10px 24px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
          {[{ label: 'Arduino', key: 'arduino' }, { label: 'Raspberry Pi', key: 'pi' }].map(({ label, key }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.72rem', fontFamily: '"DM Mono", monospace', marginBottom: 5 }}>
              <StatusDot status={sysStatus[key] ? 'online' : 'offline'} />
              <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>{sysStatus[key] ? 'online' : 'offline'}</span>
            </div>
          ))}
        </div>

        {/* Nav items */}
        {NAV.map(item => {
          if (item.adminOnly && !isAdmin) return null
          const showSection = item.section && item.section !== ls
          if (showSection) ls = item.section
          return (
            <div key={item.to}>
              {showSection && (
                <div style={{ padding: '14px 24px 4px', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-muted)', fontFamily: '"DM Mono", monospace' }}>
                  {item.section}
                </div>
              )}
              <NavLink to={item.to} end={item.to === '/'} onClick={onNav}
                style={({ isActive }) => navStyle(isActive)}>
                <NavIcon d={item.icon} />
                {item.label}
                {item.to === '/settings' && (
                  <span
                    onClick={e => { e.preventDefault(); e.stopPropagation(); setTheme('sunflower') }}
                    style={{ marginLeft: 'auto', fontSize: '1rem', cursor: 'pointer', transition: 'transform 0.3s' }}
                    title="Secret theme"
                    onMouseEnter={e => e.target.style.transform = 'rotate(20deg) scale(1.3)'}
                    onMouseLeave={e => e.target.style.transform = ''}
                  >🌻</span>
                )}
              </NavLink>
            </div>
          )
        })}

        {/* Theme switcher + user */}
        <div style={{ marginTop: 'auto', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
          <button onClick={() => setShowThemes(p => !p)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.72rem', fontFamily: '"DM Mono", monospace', padding: '4px 0' }}>
            <span>THEME</span>
            <span style={{ color: 'var(--accent)', fontSize: '0.62rem' }}>{theme.toUpperCase()}</span>
          </button>
          {showThemes && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {THEMES.map(t => (
                <button key={t.id} onClick={() => { setTheme(t.id); setShowThemes(false) }}
                  style={{ padding: '4px 8px', borderRadius: 6, fontSize: '0.62rem', fontFamily: '"DM Mono", monospace', cursor: 'pointer', border: `1px solid ${theme === t.id ? 'var(--accent)' : 'var(--border)'}`, background: theme === t.id ? 'var(--accent-glow)' : 'transparent', color: theme === t.id ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {t.label}
                </button>
              ))}
            </div>
          )}
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username}</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: '"DM Mono", monospace' }}>{user?.role}</div>
            </div>
            <button onClick={() => { logout(); navigate('/login') }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', padding: 4 }} title="Logout">⏻</button>
          </div>
        </div>
      </>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Desktop sidebar ── */}
      <aside className="bc-sidebar" style={{
        width: 240, flexShrink: 0,
        background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)',
        padding: '24px 0', position: 'sticky', top: 0, height: '100vh',
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        <SidebarContent onNav={() => {}} />
      </aside>

      {/* ── Mobile drawer backdrop ── */}
      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)} className="bc-backdrop"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300 }} />
      )}

      {/* ── Mobile drawer ── */}
      <aside className="bc-drawer" style={{
        position: 'fixed', top: 0, bottom: 0,
        left: drawerOpen ? 0 : '-270px', width: 260, zIndex: 400,
        background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)',
        padding: '24px 0', display: 'flex', flexDirection: 'column', overflowY: 'auto',
        transition: 'left 0.28s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: drawerOpen ? '4px 0 24px rgba(0,0,0,0.4)' : 'none',
      }}>
        <button onClick={() => setDrawerOpen(false)}
          style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>✕</button>
        <SidebarContent onNav={() => setDrawerOpen(false)} />
      </aside>

      {/* ── Content area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Mobile top bar */}
        <header className="bc-topbar" style={{
          display: 'none', alignItems: 'center', gap: 12,
          padding: '10px 16px', background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <button onClick={() => setDrawerOpen(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
            <svg width={22} height={22} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span style={{ fontFamily: '"Syne", sans-serif', fontWeight: 800, color: 'var(--accent)', fontSize: '1.2rem' }}>BioCube</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
            <StatusDot status={sysStatus.arduino ? 'online' : 'offline'} />
            <StatusDot status={sysStatus.pi ? 'online' : 'offline'} />
          </div>
        </header>

        {/* Main content */}
        <main className="bc-main" style={{ flex: 1, background: 'var(--bg-primary)', padding: 32, overflowY: 'auto' }}>
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="bc-bottom-nav" style={{
          display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)',
          zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          <div style={{ display: 'flex' }}>
            {NAV.filter(n => !n.adminOnly || isAdmin).map(item => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                style={({ isActive }) => ({
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: '8px 4px', flex: 1, minHeight: 52, justifyContent: 'center',
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                  textDecoration: 'none', fontSize: '0.55rem', fontFamily: '"DM Mono", monospace',
                })}>
                <NavIcon d={item.icon} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .bc-sidebar     { display: none !important; }
          .bc-topbar      { display: flex !important; }
          .bc-bottom-nav  { display: block !important; }
          .bc-main        { padding: 14px !important; padding-bottom: 72px !important; }
        }
        @media (min-width: 769px) {
          .bc-drawer      { display: none !important; }
          .bc-backdrop    { display: none !important; }
          .bc-topbar      { display: none !important; }
          .bc-bottom-nav  { display: none !important; }
        }
      `}</style>
    </div>
  )
}
