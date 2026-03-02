import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const API_BASE = import.meta.env.VITE_API_URL || ''

export const api = axios.create({ baseURL: API_BASE })

// Attach JWT to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('bc_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(() => localStorage.getItem('bc_token'))
  const [theme,   setThemeState] = useState(() => localStorage.getItem('bc_theme') || 'default')
  const [loading, setLoading] = useState(true)

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('bc_theme', theme)
  }, [theme])

  // Verify token on mount
  useEffect(() => {
    if (!token) { setLoading(false); return }
    api.get('/api/settings/me')
      .then(r => { setUser(r.data); setThemeState(r.data.theme || 'default') })
      .catch(() => { localStorage.removeItem('bc_token'); setToken(null) })
      .finally(() => setLoading(false))
  }, [token])

  const login = useCallback(async (username, password) => {
    const r = await api.post('/api/auth/login', { username, password })
    const { token: t, user: u, mustChangePassword } = r.data
    localStorage.setItem('bc_token', t)
    setToken(t)
    setUser(u)
    setThemeState(u.theme || 'default')
    return { mustChangePassword }
  }, [])

  const register = useCallback(async (username, email, password) => {
    const r = await api.post('/api/auth/register', { username, email, password })
    const { token: t, user: u } = r.data
    localStorage.setItem('bc_token', t)
    setToken(t)
    setUser(u)
    setThemeState(u.theme || 'default')
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('bc_token')
    setToken(null)
    setUser(null)
  }, [])

  const setTheme = useCallback(async (newTheme) => {
    setThemeState(newTheme)
    if (user) {
      try { await api.patch('/api/settings/theme', { theme: newTheme }) }
      catch {}
    }
  }, [user])

  const refreshUser = useCallback(async () => {
    const r = await api.get('/api/settings/me')
    setUser(r.data)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, theme, login, register, logout, setTheme, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
