// pages/Automation.jsx
import { useState, useEffect } from 'react'
import { api } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'
import { Card, PageHeader, Btn, Alert, Toggle, ThresholdSlider, Badge } from '../components/UI'

const DEFAULT_THRESH = {
  tempMax: 30, tempMin: 18, humidityMax: 75,
  soilMoist1: 60, soilMoist2: 60,
  npk_N: 15, npk_P: 15, npk_K: 30,
}

export default function Automation({ liveData }) {
  const { user } = useAuth()
  const restricted = user?.restricted
  const automation = liveData?.automation ?? true
  const [thresholds, setThresholds] = useState(liveData?.thresholds || DEFAULT_THRESH)
  const [pending, setPending] = useState({})
  const [sending, setSending] = useState({})
  const [success, setSuccess] = useState('')
  const [error,   setError]   = useState('')

  // Sync thresholds from live data
  useEffect(() => {
    if (liveData?.thresholds) setThresholds(liveData.thresholds)
  }, [liveData?.thresholds])

  const sendThreshold = async (key, value) => {
    if (restricted) { setError('Your account is restricted.'); return }
    setSending(p => ({ ...p, [key]: true }))
    setError(''); setSuccess('')
    try {
      await api.post('/api/commands/threshold', { key, value })
      setSuccess(`${key} updated to ${value}`)
      setPending(p => { const n = { ...p }; delete n[key]; return n })
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send command')
    } finally {
      setSending(p => ({ ...p, [key]: false }))
    }
  }

  const toggleAutomation = async () => {
    if (restricted) { setError('Your account is restricted.'); return }
    try {
      await api.post('/api/commands/automation', { enabled: !automation })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed')
    }
  }

  const handleChange = (key, val) => {
    setThresholds(p => ({ ...p, [key]: val }))
    setPending(p => ({ ...p, [key]: val }))
  }

  const SliderWithSend = ({ k, ...props }) => (
    <div>
      <ThresholdSlider key={k} {...props} value={thresholds[k] ?? props.min} onChange={v => handleChange(k, v)} />
      {pending[k] !== undefined && (
        <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
          <Btn size="sm" onClick={() => sendThreshold(k, thresholds[k])} disabled={sending[k]}>
            {sending[k] ? 'Sending…' : 'Apply'}
          </Btn>
        </div>
      )}
    </div>
  )

  return (
    <div className="fade-in">
      <PageHeader
        title="Automation"
        subtitle="Set thresholds — the system acts automatically when values cross these limits"
        actions={<Badge type={automation ? 'success' : 'warning'} dot>Automation {automation ? 'ON' : 'OFF'}</Badge>}
      />

      {restricted && <Alert type="warning" style={{ marginBottom: 24 }}>Your account is restricted from making changes.</Alert>}
      {error   && <Alert type="danger"  style={{ marginBottom: 16 }}>{error}</Alert>}
      {success && <Alert type="success" style={{ marginBottom: 16 }}>✓ {success}</Alert>}

      {/* Automation master toggle */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontFamily: '"Syne", sans-serif', fontWeight: 600, fontSize: '1rem' }}>Automation Mode</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
              When ON: system controls all actuators automatically.<br/>
              When OFF: Manual page allows direct control.
            </div>
          </div>
          <Toggle checked={automation} onChange={toggleAutomation} label={automation ? 'Enabled' : 'Disabled'} />
        </div>
      </Card>

      {/* Environment */}
      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 3, color: 'var(--text-muted)', fontFamily: '"DM Mono", monospace', marginBottom: 10 }}>Environment</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>
        <SliderWithSend k="tempMax"     title="Temp Max"      min={15} max={45} unit="°C" />
        <SliderWithSend k="tempMin"     title="Temp Min"      min={5}  max={30} unit="°C" />
        <SliderWithSend k="humidityMax" title="Humidity Max"  min={30} max={100} unit="%" />
      </div>

      {/* Soil */}
      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 3, color: 'var(--text-muted)', fontFamily: '"DM Mono", monospace', marginBottom: 10 }}>Soil</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>
        <SliderWithSend k="soilMoist1" title="Soil Moisture — Plant 1" min={10} max={100} unit="%" hint="Water pump activates below target" />
        <SliderWithSend k="soilMoist2" title="Soil Moisture — Plant 2" min={10} max={100} unit="%" hint="Water pump activates below target" />
      </div>

      {/* NPK */}
      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 3, color: 'var(--text-muted)', fontFamily: '"DM Mono", monospace', marginBottom: 10 }}>Nutrients (N-P-K)</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <SliderWithSend k="npk_N" title="Nitrogen (N)"    min={0} max={200} unit=" mg/kg" color="var(--chart-1)" hint="Nutrient pump activates below target" />
        <SliderWithSend k="npk_P" title="Phosphorus (P)"  min={0} max={200} unit=" mg/kg" color="var(--chart-2)" hint="Nutrient pump activates below target" />
        <SliderWithSend k="npk_K" title="Potassium (K)"   min={0} max={200} unit=" mg/kg" color="var(--chart-3)" hint="Nutrient pump activates below target" />
      </div>
    </div>
  )
}
