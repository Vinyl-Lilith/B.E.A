// components/Layout.jsx
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
  { to: '/',          label: 'Home',       icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', section: 'Monitor' },
  { to: '/automation',label: 'Automation', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4', section: 'Control' },
  { to: '/manual',    label: 'Manual',     icon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5', section: null },
  { to: '/admin',     label: 'Admin',      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', section: 'System', adminOnly: true },
  { to: '/settings',  label: 'Settings',   icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', section: null },
]

export default function Layout({ children, sysStatus = {} }) {
  const { user, logout, theme, setTheme } = useAuth()
  const navigate = useNavigate()
  const [showThemes, setShowThemes] = useState(false)
  const isAdmin = user?.role === 'admin' || user?.role === 'head_admin'

  const navStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 24px', fontSize: '0.9rem', fontWeight: 500,
    borderLeft: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
    background: isActive ? 'var(--accent-glow)' : 'transparent',
    textDecoration: 'none', transition: 'all 0.15s', cursor: 'pointer',
  })

  let lastSection = null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)',
        padding: '24px 0', position: 'sticky', top: 0, height: '100vh',
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '0 24px 24px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
          <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.5px' }}>
            BioCube
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, fontFamily: '"DM Mono", monospace' }}>
            Smart Greenhouse
          </div>
        </div>

        {/* System status */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { label: 'Arduino', key: 'arduino' },
            { label: 'Raspberry Pi', key: 'pi' },
          ].map(({ label, key }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontFamily: '"DM Mono", monospace' }}>
              <StatusDot status={sysStatus[key] ? 'online' : 'offline'} />
              <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>{sysStatus[key] ? 'online' : 'offline'}</span>
            </div>
          ))}
        </div>

        {/* Nav items */}
        {NAV.map(item => {
          if (item.adminOnly && !isAdmin) return null
          const showSection = item.section && item.section !== lastSection
          if (showSection) lastSection = item.section
          return (
            <div key={item.to}>
              {showSection && (
                <div style={{ padding: '16px 24px 4px', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-muted)', fontFamily: '"DM Mono", monospace' }}>
                  {item.section}
                </div>
              )}
              <NavLink to={item.to} end={item.to === '/'}
                style={({ isActive }) => navStyle(isActive)}>
                <NavIcon d={item.icon} />
                {item.label}
                {item.to === '/settings' && (
                  <span
                    onClick={e => { e.preventDefault(); e.stopPropagation(); setTheme('sunflower') }}
                    style={{ marginLeft: 'auto', fontSize: '1.1rem', cursor: 'pointer', transition: 'transform 0.3s' }}
                    title="Secret theme"
                    onMouseEnter={e => e.target.style.transform = 'rotate(20deg) scale(1.3)'}
                    onMouseLeave={e => e.target.style.transform = ''}
                  >🌻</span>
                )}
              </NavLink>
            </div>
          )
        })}

        {/* Theme switcher */}
        <div style={{ marginTop: 'auto', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setShowThemes(p => !p)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', fontFamily: '"DM Mono", monospace', padding: '4px 0' }}
          >
            <span>THEME</span>
            <span style={{ color: 'var(--accent)', fontSize: '0.65rem' }}>{theme.toUpperCase()}</span>
          </button>
          {showThemes && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {THEMES.map(t => (
                <button key={t.id} onClick={() => { setTheme(t.id); setShowThemes(false) }}
                  style={{
                    padding: '4px 8px', borderRadius: 6, fontSize: '0.65rem',
                    fontFamily: '"DM Mono", monospace', cursor: 'pointer',
                    border: `1px solid ${theme === t.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: theme === t.id ? 'var(--accent-glow)' : 'transparent',
                    color: theme === t.id ? 'var(--accent)' : 'var(--text-muted)',
                  }}>{t.label}</button>
              ))}
            </div>
          )}
          {/* User info + logout */}
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: '"DM Mono", monospace' }}>{user?.role}</div>
            </div>
            <button onClick={() => { logout(); navigate('/login') }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', padding: 4 }}
              title="Logout">
              ⏻
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ background: 'var(--bg-primary)', padding: 32, overflowY: 'auto', minHeight: '100vh' }}>
        {children}
      </main>

      {/* ── Mobile nav ── */}
      <nav style={{
        display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)',
        zIndex: 100, padding: '8px 0',
      }} className="mobile-nav">
        {NAV.filter(n => !n.adminOnly || isAdmin).map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '6px 12px', flex: 1,
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              textDecoration: 'none', fontSize: '0.6rem', fontFamily: '"DM Mono", monospace',
            })}>
            <NavIcon d={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .mobile-nav { display: flex !important; }
          main { padding: 16px; padding-bottom: 80px; }
          aside { display: none; }
          div[style*="gridTemplateColumns"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
