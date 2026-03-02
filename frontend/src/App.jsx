// App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useWebSocket } from './hooks/useWebSocket'
import Layout from './components/Layout'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Automation from './pages/Automation'
import Manual from './pages/Manual'
import Admin from './pages/Admin'
import Settings from './pages/Settings'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !['admin', 'head_admin'].includes(user.role)) return <Navigate to="/" replace />
  return children
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>BioCube</div>
      <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function AppInner() {
  const { user, token } = useAuth()
  const { on, connected } = useWebSocket(token)

  const [liveData,  setLiveData]  = useState(null)
  const [sysStatus, setSysStatus] = useState({ arduino: false, pi: false })

  useEffect(() => {
    on('sensor_update',    data => setLiveData(prev => ({ ...prev, ...data, timestamp: new Date() })))
    on('arduino_status',   data => setSysStatus(p => ({ ...p, arduino: data.online })))
    on('pi_status',        data => setSysStatus(p => ({ ...p, pi: data.online })))
    on('stream_url_update',() => {}) // Home component handles this via API
  }, [on])

  // Mark Arduino/Pi connected based on WS connection to backend
  useEffect(() => {
    if (!connected) setSysStatus({ arduino: false, pi: false })
  }, [connected])

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Auth />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout sysStatus={sysStatus}>
            <Home liveData={liveData} sysStatus={sysStatus} />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/automation" element={
        <ProtectedRoute>
          <Layout sysStatus={sysStatus}>
            <Automation liveData={liveData} />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/manual" element={
        <ProtectedRoute>
          <Layout sysStatus={sysStatus}>
            <Manual liveData={liveData} />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute adminOnly>
          <Layout sysStatus={sysStatus}>
            <Admin sysStatus={sysStatus} />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout sysStatus={sysStatus}>
            <Settings />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
