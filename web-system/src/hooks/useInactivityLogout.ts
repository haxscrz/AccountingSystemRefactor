import { useEffect, useRef, useCallback, useState } from 'react'
import { useAuthStore } from '../stores/authStore'

const WARNING_AT_MS = 4 * 60 * 1000       // Show warning at 4 minutes
const LOGOUT_AT_MS = 5 * 60 * 1000        // Logout at 5 minutes
const COUNTDOWN_SECONDS = Math.floor((LOGOUT_AT_MS - WARNING_AT_MS) / 1000) // 60 seconds

export function useInactivityLogout() {
  const logout = useAuthStore((s) => s.logout)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastActivityRef = useRef(Date.now())
  
  const [showWarningToast, setShowWarningToast] = useState(false)
  const showWarningToastRef = useRef(showWarningToast)
  useEffect(() => { showWarningToastRef.current = showWarningToast }, [showWarningToast])
  const [secondsRemaining, setSecondsRemaining] = useState(COUNTDOWN_SECONDS)
  const [showWelcomeBack, setShowWelcomeBack] = useState(false)

  // Clean up all timers
  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current) { clearTimeout(warningTimerRef.current); warningTimerRef.current = null }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null }
  }, [])

  // Start the countdown interval
  const startCountdown = useCallback(() => {
    setShowWarningToast(true)
    setSecondsRemaining(COUNTDOWN_SECONDS)
    
    countdownRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          // Time's up — logout
          clearAllTimers()
          setShowWarningToast(false)
          alert('You have been automatically logged out due to inactivity.')
          logout()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [clearAllTimers, logout])

  // Set the initial warning timer
  const resetTimer = useCallback(() => {
    clearAllTimers()
    setShowWarningToast(false)
    setSecondsRemaining(COUNTDOWN_SECONDS)
    lastActivityRef.current = Date.now()

    if (isAuthenticated) {
      warningTimerRef.current = setTimeout(() => {
        startCountdown()
      }, WARNING_AT_MS)
    }
  }, [isAuthenticated, clearAllTimers, startCountdown])

  // User explicitly dismisses the warning
  const dismissWarning = useCallback(() => {
    clearAllTimers()
    setShowWarningToast(false)
    setSecondsRemaining(COUNTDOWN_SECONDS)
    
    // Show welcome back toast briefly
    setShowWelcomeBack(true)
    setTimeout(() => setShowWelcomeBack(false), 3000)
    
    // Restart the inactivity timer
    resetTimer()
  }, [clearAllTimers, resetTimer])

  // Activity detection
  useEffect(() => {
    if (!isAuthenticated) {
      clearAllTimers()
      setShowWarningToast(false)
      setShowWelcomeBack(false)
      return
    }

    const onActivity = () => {
      // Only reset if the warning toast is NOT showing
      // (so user must click "I'm still here" to dismiss)
      if (!showWarningToastRef.current) {
        resetTimer()
      }
    }

    const events = ['mousedown', 'keydown', 'mousemove', 'scroll', 'touchstart', 'click']
    events.forEach(e => window.addEventListener(e, onActivity, { passive: true }))
    resetTimer()

    return () => {
      events.forEach(e => window.removeEventListener(e, onActivity))
    }
  }, [isAuthenticated, resetTimer, clearAllTimers])

  return { 
    showWarningToast, 
    secondsRemaining, 
    showWelcomeBack, 
    dismissWarning 
  }
}
