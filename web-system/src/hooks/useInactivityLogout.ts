import { useEffect, useRef, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

export function useInactivityLogout() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showModal, setShowModal] = useState(false)

  const handleLogout = useCallback(() => {
    setShowModal(true)
    logout()
  }, [logout])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (isAuthenticated) {
      timerRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT_MS)
    }
  }, [isAuthenticated, handleLogout])

  const dismissModal = useCallback(() => {
    setShowModal(false)
    navigate('/login')
  }, [navigate])

  useEffect(() => {
    if (!isAuthenticated) {
      if (timerRef.current) clearTimeout(timerRef.current)
      return
    }

    const events = ['mousedown', 'keydown', 'mousemove', 'scroll', 'touchstart', 'click']
    const onActivity = () => resetTimer()

    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))
    resetTimer()

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isAuthenticated, resetTimer])

  return { showInactivityModal: showModal, dismissInactivityModal: dismissModal }
}
