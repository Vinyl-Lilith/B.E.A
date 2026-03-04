import { useEffect, useRef, useCallback, useState } from 'react'

const WS_BASE = import.meta.env.VITE_WS_URL || (
  window.location.protocol === 'https:' ? 'wss://' : 'ws://'
) + window.location.host

export function useWebSocket(token) {
  const ws      = useRef(null)
  const handlers = useRef({})
  const [connected, setConnected] = useState(false)

  const on = useCallback((event, handler) => {
    handlers.current[event] = handler
  }, [])

  const off = useCallback((event) => {
    delete handlers.current[event]
  }, [])

  useEffect(() => {
    if (!token) return

    function connect() {
      const socket = new WebSocket(`${WS_BASE}/ws/dashboard`)
      ws.current = socket

      socket.onopen = () => setConnected(true)

      socket.onmessage = (e) => {
        try {
          const { event, data } = JSON.parse(e.data)
          const handler = handlers.current[event]
          if (handler) handler(data)
          // Also call wildcard handler
          const wildcard = handlers.current['*']
          if (wildcard) wildcard(event, data)
        } catch {}
      }

      socket.onclose = () => {
        setConnected(false)
        // Reconnect after 5s
        setTimeout(connect, 5000)
      }

      socket.onerror = () => socket.close()
    }

    connect()
    return () => {
      if (ws.current) ws.current.close()
    }
  }, [token])

  return { connected, on, off }
}
