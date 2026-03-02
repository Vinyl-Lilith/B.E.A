// pages/Home.jsx
import { useState, useEffect, useCallback } from 'react'
import { api } from '../context/AuthContext'
import { Card, Badge, PageHeader, Btn, Alert, StatusDot } from '../components/UI'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function SensorCard({ label, value, unit, threshold, thresholdLabel, status = 'normal' }) {
  const dotStatus = status === 'warn' ? 'warn' : status === 'danger' ? 'offline' : 'online'
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
      padding: 20, display: 'flex', flexDirection: 'column', gap: 8,
      position: 'relative', overflow: 'hidden', transition: 'all 0.2s',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--accent)', opacity: 0.6 }} />
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <StatusDot status={dotStatus} />
      </div>
      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-muted)', fontFamily: '"DM Mono", monospace' }}>
        {label}
      </div>
      <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '2rem', fontWeight: 500, lineHeight: 1 }}>
        {value ?? '—'}
        {value != null && <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: 4 }}>{unit}</span>}
      </div>
      {threshold != null && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: '"DM Mono", monospace' }}>
          {thresholdLabel}: <span style={{ color: 'var(--accent)' }}>{threshold}{unit}</span>
        </div>
      )}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.75rem', fontFamily: '"DM Mono", monospace' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {p.value?.toFixed(1)}</div>
      ))}
    </div>
  )
}

export default function Home({ liveData, sysStatus }) {
  const [history, setHistory] = useState([])
  const [exportDate, setExportDate] = useState(new Date().toISOString().slice(0, 10))
  const [exporting, setExporting] = useState(false)
  const [exportErr, setExportErr] = useState('')

  const sensors = liveData?.sensors || {}
  const thresholds = liveData?.thresholds || {}
  const actuators = liveData?.actuators || {}
  const automation = liveData?.automation

  // Load today's history for charts
  useEffect(() => {
    api.get(`/api/data/history?date=${new Date().toISOString().slice(0, 10)}&limit=200`)
      .then(r => {
        const formatted = r.data.map(d => ({
          time: new Date(d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          temp: d.sensors?.tempAvg,
          hum: d.sensors?.humAvg,
          soil: ((d.sensors?.soil1 ?? 0) + (d.sensors?.soil2 ?? 0)) / 2,
          N: d.sensors?.npk_N,
          P: d.sensors?.npk_P,
          K: d.sensors?.npk_K,
        }))
        setHistory(formatted)
      })
      .catch(() => {})
  }, [])

  const handleExport = async () => {
    setExporting(true); setExportErr('')
    try {
      const res = await api.get(`/api/data/export?date=${exportDate}`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url; a.download = `BioCube_${exportDate}.xlsx`; a.click()
      URL.revokeObjectURL(url)
    } catch {
      setExportErr('No data for this date')
    } finally { setExporting(false) }
  }

  const ActuatorBadge = ({ on, label }) => (
    <Badge type={on ? 'success' : 'muted'} dot>{label}: {on ? 'ON' : 'OFF'}</Badge>
  )

  return (
    <div className="fade-in">
      <PageHeader
        title="Home"
        subtitle={liveData ? `Last updated: ${new Date(liveData.timestamp || Date.now()).toLocaleTimeString()}` : 'Waiting for data…'}
        actions={<Badge type={automation ? 'success' : 'warning'} dot>Automation {automation ? 'ON' : 'OFF'}</Badge>}
      />

      {/* Sensor cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <SensorCard label="Temperature" value={sensors.tempAvg?.toFixed(1)} unit="°C"
          threshold={thresholds.tempMax} thresholdLabel="Max"
          status={sensors.tempAvg > thresholds.tempMax ? 'danger' : sensors.tempAvg > thresholds.tempMax - 2 ? 'warn' : 'normal'} />
        <SensorCard label="Humidity" value={sensors.humAvg?.toFixed(0)} unit="%"
          threshold={thresholds.humidityMax} thresholdLabel="Max"
          status={sensors.humAvg > thresholds.humidityMax ? 'danger' : 'normal'} />
        <SensorCard label="Soil — Plant 1" value={sensors.soil1?.toFixed(0)} unit="%"
          threshold={thresholds.soilMoist1} thresholdLabel="Min"
          status={sensors.soil1 < thresholds.soilMoist1 ? 'warn' : 'normal'} />
        <SensorCard label="Soil — Plant 2" value={sensors.soil2?.toFixed(0)} unit="%"
          threshold={thresholds.soilMoist2} thresholdLabel="Min"
          status={sensors.soil2 < thresholds.soilMoist2 ? 'warn' : 'normal'} />
      </div>

      {/* NPK row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[['Nitrogen (N)', 'npk_N', 'var(--chart-1)'], ['Phosphorus (P)', 'npk_P', 'var(--chart-2)'], ['Potassium (K)', 'npk_K', 'var(--chart-3)']].map(([label, key, color]) => (
          <div key={key} style={{ background: 'var(--bg-card)', border: `1px solid var(--border)`, borderRadius: 12, padding: 16, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color }} />
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-muted)', fontFamily: '"DM Mono", monospace', marginBottom: 8 }}>{label}</div>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '1.8rem', color }}>
              {sensors[key] ?? '—'}<span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: 4 }}>mg/kg</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: '"DM Mono", monospace', marginTop: 4 }}>
              Target: <span style={{ color }}>{thresholds[key] ?? '—'} mg/kg</span>
            </div>
          </div>
        ))}
      </div>

      {/* Webcam + Temp/Hum chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16, marginBottom: 24 }}>
        {/* Webcam */}
        <WebcamFeed />

        {/* Temp/Hum chart */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontFamily: '"Syne", sans-serif', fontWeight: 600 }}>Temperature & Humidity</span>
            <div style={{ display: 'flex', gap: 12 }}>
              {[['Temp', 'var(--chart-1)'], ['Humidity', 'var(--chart-2)']].map(([name, color]) => (
                <span key={name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: '"DM Mono", monospace' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />{name}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: '"DM Mono"' }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: '"DM Mono"' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="temp" name="Temp" stroke="var(--chart-1)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="hum" name="Humidity" stroke="var(--chart-2)" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Soil + NPK chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <Card>
          <div style={{ marginBottom: 16, fontFamily: '"Syne", sans-serif', fontWeight: 600 }}>Soil Moisture</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="soil" name="Soil %" stroke="var(--chart-3)" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div style={{ marginBottom: 16, fontFamily: '"Syne", sans-serif', fontWeight: 600 }}>NPK Levels</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="N" name="N" stroke="var(--chart-1)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="P" name="P" stroke="var(--chart-2)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="K" name="K" stroke="var(--chart-3)" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Actuator status */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: '"Syne", sans-serif', fontWeight: 600, marginBottom: 12 }}>Actuator Status</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <ActuatorBadge on={actuators.exhaustFan}   label="Exhaust Fan" />
          <ActuatorBadge on={actuators.peltierOn}    label="Peltier" />
          <ActuatorBadge on={actuators.fanCold}      label="Fan Cold" />
          <ActuatorBadge on={actuators.fanHot}       label="Fan Hot" />
          <ActuatorBadge on={actuators.pumpWater}    label="Water Pump" />
          <ActuatorBadge on={actuators.pumpNutrient} label="Nutrient Pump" />
        </div>
      </Card>

      {/* Export */}
      <Card>
        <div style={{ fontFamily: '"Syne", sans-serif', fontWeight: 600, marginBottom: 12 }}>Export Data</div>
        {exportErr && <Alert type="danger" style={{ marginBottom: 12 }}>{exportErr}</Alert>}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: '"DM Mono", monospace', textTransform: 'uppercase', letterSpacing: 1 }}>Date</label>
            <input type="date" value={exportDate} onChange={e => setExportDate(e.target.value)}
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)', fontFamily: '"DM Sans"', fontSize: '0.9rem', outline: 'none' }} />
          </div>
          <Btn onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting…' : '↓ Download Excel'}
          </Btn>
        </div>
      </Card>
    </div>
  )
}

function WebcamFeed() {
  const [streamUrl, setStreamUrl] = useState(null)
  const [err, setErr] = useState(false)

  useEffect(() => {
    api.get('/api/data/stream-url')
      .then(r => { if (r.data.url) setStreamUrl(r.data.url) })
      .catch(() => {})
  }, [])

  return (
    <div style={{ background: '#000', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', position: 'relative', aspectRatio: '4/3' }}>
      {streamUrl && !err ? (
        <img src={streamUrl} alt="Webcam" onError={() => setErr(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-muted)', fontFamily: '"DM Mono", monospace', fontSize: '0.8rem',
          background: 'repeating-linear-gradient(45deg, var(--bg-card), var(--bg-card) 10px, var(--bg-secondary) 10px, var(--bg-secondary) 20px)' }}>
          <svg width={36} height={36} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          <span>{streamUrl ? 'STREAM UNAVAILABLE' : 'NO STREAM URL'}</span>
        </div>
      )}
      <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.6)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 8px', fontSize: '0.7rem', fontFamily: '"DM Mono", monospace', color: 'var(--text-secondary)', backdropFilter: 'blur(8px)' }}>
        <StatusDot status={streamUrl && !err ? 'online' : 'offline'} />
        {streamUrl && !err ? 'LIVE' : 'OFFLINE'}
      </div>
    </div>
  )
}
