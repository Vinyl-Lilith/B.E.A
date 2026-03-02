// components/UI.jsx — shared primitive components

import { useState } from 'react'

/* ── Card ──────────────────────────────────────────────── */
export function Card({ children, className = '', style = {} }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, padding: 24, ...style
    }} className={className}>
      {children}
    </div>
  )
}

/* ── Badge ─────────────────────────────────────────────── */
const BADGE_STYLES = {
  success: { bg: 'rgba(45,189,110,0.15)', color: 'var(--success)', border: 'rgba(45,189,110,0.3)' },
  danger:  { bg: 'rgba(255,77,109,0.15)', color: 'var(--danger)',  border: 'rgba(255,77,109,0.3)' },
  warning: { bg: 'rgba(255,184,48,0.15)', color: 'var(--warning)', border: 'rgba(255,184,48,0.3)' },
  info:    { bg: 'rgba(0,229,255,0.1)',   color: 'var(--info)',    border: 'rgba(0,229,255,0.3)' },
  muted:   { bg: 'var(--bg-secondary)',   color: 'var(--text-muted)', border: 'var(--border)' },
}

export function Badge({ type = 'muted', dot = false, children }) {
  const s = BADGE_STYLES[type] || BADGE_STYLES.muted
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      fontSize: '0.72rem', fontWeight: 500,
      fontFamily: '"DM Mono", monospace', letterSpacing: '0.5px',
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />}
      {children}
    </span>
  )
}

/* ── Button ────────────────────────────────────────────── */
export function Btn({ variant = 'primary', size = 'md', onClick, disabled, children, style = {}, type = 'button' }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: '"DM Sans", sans-serif', fontWeight: 500, textDecoration: 'none',
    transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
    borderRadius: 8, whiteSpace: 'nowrap',
  }
  const sizes = { sm: { padding: '6px 14px', fontSize: '0.8rem' }, md: { padding: '10px 20px', fontSize: '0.875rem' }, lg: { padding: '14px 28px', fontSize: '1rem', borderRadius: 10 } }
  const variants = {
    primary:   { background: 'var(--accent)', color: 'var(--bg-primary)' },
    secondary: { background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)' },
    danger:    { background: 'var(--danger)', color: '#fff' },
    ghost:     { background: 'transparent', color: 'var(--text-secondary)' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>
      {children}
    </button>
  )
}

/* ── Input ─────────────────────────────────────────────── */
export function Input({ label, type = 'text', value, onChange, placeholder, mono = false, ...rest }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, fontFamily: '"DM Mono", monospace' }}>{label}</label>}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{
          background: 'var(--bg-input)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)',
          fontFamily: mono ? '"DM Mono", monospace' : '"DM Sans", sans-serif',
          fontSize: '0.9rem', outline: 'none', width: '100%',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
        onBlur={e  => e.target.style.borderColor = 'var(--border)'}
        {...rest}
      />
    </div>
  )
}

/* ── Textarea ──────────────────────────────────────────── */
export function Textarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, fontFamily: '"DM Mono", monospace' }}>{label}</label>}
      <textarea
        value={value} onChange={onChange} placeholder={placeholder} rows={rows}
        style={{
          background: 'var(--bg-input)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)',
          fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem', outline: 'none',
          width: '100%', resize: 'vertical', transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
        onBlur={e  => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}

/* ── Toggle ────────────────────────────────────────────── */
export function Toggle({ checked, onChange, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <label style={{ position: 'relative', width: 44, height: 24, cursor: 'pointer', flexShrink: 0 }}>
        <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
        <span style={{
          position: 'absolute', inset: 0, borderRadius: 24,
          background: checked ? 'var(--accent)' : 'var(--border)',
          transition: 'background 0.2s',
        }}>
          <span style={{
            position: 'absolute', width: 18, height: 18, borderRadius: '50%',
            top: 3, left: checked ? 23 : 3,
            background: checked ? 'var(--bg-primary)' : 'var(--text-muted)',
            transition: 'left 0.2s, background 0.2s',
          }} />
        </span>
      </label>
      {label && <span style={{ fontSize: '0.875rem' }}>{label}</span>}
    </div>
  )
}

/* ── Alert ─────────────────────────────────────────────── */
const ALERT_STYLES = {
  success: { bg: 'rgba(45,189,110,0.1)',  border: 'rgba(45,189,110,0.25)', color: 'var(--success)' },
  danger:  { bg: 'rgba(255,77,109,0.1)',  border: 'rgba(255,77,109,0.25)', color: 'var(--danger)' },
  warning: { bg: 'rgba(255,184,48,0.1)',  border: 'rgba(255,184,48,0.25)', color: 'var(--warning)' },
  info:    { bg: 'rgba(0,229,255,0.08)',  border: 'rgba(0,229,255,0.2)',   color: 'var(--info)' },
}

export function Alert({ type = 'info', children }) {
  const s = ALERT_STYLES[type]
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 10, fontSize: '0.875rem',
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
    }}>
      {children}
    </div>
  )
}

/* ── Status dot ────────────────────────────────────────── */
export function StatusDot({ status = 'online' }) {
  const colors = { online: 'var(--success)', offline: 'var(--danger)', warn: 'var(--warning)' }
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: colors[status],
      boxShadow: `0 0 6px ${colors[status]}`,
      animation: status !== 'offline' ? 'pulse-dot 2s infinite' : 'none',
      flexShrink: 0,
    }} />
  )
}

/* ── Spinner ───────────────────────────────────────────── */
export function Spinner({ size = 24 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid var(--border)`,
      borderTopColor: 'var(--accent)',
      animation: 'spin 0.8s linear infinite',
    }} />
  )
}

/* ── Threshold Slider ──────────────────────────────────── */
export function ThresholdSlider({ title, value, min, max, unit, color, hint, onChange }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: `1px solid ${color || 'var(--border)'}`,
      borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: color || 'var(--text-secondary)', fontFamily: '"DM Mono", monospace' }}>
          {title}
        </span>
        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '1.1rem', fontWeight: 500, color: color || 'var(--accent)' }}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: color || 'var(--accent)', cursor: 'pointer' }}
      />
      {hint && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: '"DM Mono", monospace' }}>{hint}</div>}
    </div>
  )
}

/* ── Page header ───────────────────────────────────────── */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
      <div>
        <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.5px' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 4 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{actions}</div>}
    </div>
  )
}
