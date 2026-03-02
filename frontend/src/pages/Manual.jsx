// pages/Manual.jsx
import { useState } from 'react'
import { api } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'
import { Card, PageHeader, Alert, Badge, Toggle } from '../components/UI'

const ACTUATORS = [
  { key: 'exhaustFan',   label: 'Exhaust Fan',   desc: 'Humidity & heat regulation', icon: '🌀' },
  { key: 'peltier',      label: 'Peltier + Fans', desc: 'Active temperature cooling', icon: '❄️' },
  { key: 'pumpWater',    label: 'Water Pump',     desc: 'Soil moisture supply',        icon: '💧' },
  { key: 'pumpNutrient', label: 'Nutrient Pump',  desc: 'NPK solution delivery',       icon: '🌿' },
]

export default function Manual({ liveData }) {
  const { user } = useAuth()
  const restricted = user?.restricted
  const automation = liveData?.automation ?? true
  const actuators  = liveData?.actuators  || {}

  const [sending, setSending] = useState({})
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  const toggle = async (key, currentState) => {
    if (restricted) { setError('Your account is restricted.'); return }
    if (automation) { setError('Turn automation OFF before using manual controls.'); return }
    setSending(p => ({ ...p, [key]: true }))
    setError(''); setSuccess('')
    try {
      await api.post('/api/commands/actuator', { actuator: key, state: !currentState })
      setSuccess(`${key} set to ${!currentState ? 'ON' : 'OFF'}`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Command failed')
    } finally {
      setSending(p => ({ ...p, [key]: false }))
    }
  }

  const locked = automation || restricted

  return (
    <div className="fade-in">
      <PageHeader
        title="Manual Control"
        subtitle="Directly control actuators — requires automation to be OFF"
        actions={<Badge type={automation ? 'warning' : 'success'} dot>Automation {automation ? 'ON' : 'OFF'}</Badge>}
      />

      {automation && (
        <Alert type="warning" style={{ marginBottom: 24 }}>
          ⚠ Automation is currently ON. Go to the Automation page and turn it off to enable manual control.
        </Alert>
      )}
      {restricted && (
        <Alert type="danger" style={{ marginBottom: 24 }}>
          Your account is restricted from manual control.
        </Alert>
      )}
      {error   && <Alert type="danger"  style={{ marginBottom: 16 }}>{error}</Alert>}
      {success && <Alert type="success" style={{ marginBottom: 16 }}>✓ {success}</Alert>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {ACTUATORS.map(({ key, label, desc, icon }) => {
          const isOn = key === 'peltier' ? actuators.peltierOn : actuators[key]
          return (
            <div key={key} style={{
              background: 'var(--bg-card)',
              border: `1px solid ${isOn && !locked ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 12, padding: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              opacity: locked ? 0.55 : 1,
              transition: 'all 0.2s',
              boxShadow: isOn && !locked ? '0 0 20px var(--accent-glow)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: '1.6rem' }}>{icon}</span>
                <div>
                  <div style={{ fontFamily: '"Syne", sans-serif', fontWeight: 600, fontSize: '0.95rem' }}>{label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
                  {isOn && !locked && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontFamily: '"DM Mono", monospace', marginTop: 4, animation: 'pulse-dot 1.5s infinite' }}>
                      ● RUNNING
                    </div>
                  )}
                </div>
              </div>
              <Toggle
                checked={!!isOn}
                onChange={() => toggle(key, !!isOn)}
                disabled={locked || sending[key]}
              />
            </div>
          )
        })}
      </div>

      {/* Peltier PWM readout if active */}
      {actuators.peltierOn && !locked && (
        <Card style={{ marginTop: 24 }}>
          <div style={{ fontFamily: '"Syne", sans-serif', fontWeight: 600, marginBottom: 12 }}>Peltier Intensity</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${actuators.peltierPWM ?? 0}%`, background: 'var(--accent-alt)', borderRadius: 4, transition: 'width 0.5s' }} />
            </div>
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '1.1rem', color: 'var(--accent-alt)', minWidth: 48 }}>
              {actuators.peltierPWM ?? 0}%
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>PWM duty cycle — controlled by Arduino firmware</div>
        </Card>
      )}
    </div>
  )
}
