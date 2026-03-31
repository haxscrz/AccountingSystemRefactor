import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  username: string
  role: 'superadmin' | 'tester' | 'accountant'
  canAccessFs: boolean
  canAccessPayroll: boolean
  assignedCompanies: string[] | null
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  accessTokenExpiresAtUtc: string | null
  refreshTokenExpiresAtUtc: string | null
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
}

interface LoginApiResponse {
  success: boolean
  message: string
  user: {
    username: string
    role: 'superadmin' | 'tester' | 'accountant'
    canAccessFs: boolean
    canAccessPayroll: boolean
    assignedCompanies: string[] | null
  } | null
  tokens: {
    accessToken: string
    accessTokenExpiresAtUtc: string
    refreshToken: string
    refreshTokenExpiresAtUtc: string
  } | null
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      accessTokenExpiresAtUtc: null,
      refreshTokenExpiresAtUtc: null,
      login: async (username: string, password: string) => {
        const controller = new AbortController()
        const timeoutId = window.setTimeout(() => controller.abort(), 15000)

        let response: Response
        try {
          response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            signal: controller.signal
          })
        } catch {
          set({
            user: null,
            isAuthenticated: false,
            accessToken: null,
            refreshToken: null,
            accessTokenExpiresAtUtc: null,
            refreshTokenExpiresAtUtc: null
          })
          return { success: false, message: 'Cannot reach server right now. Please try again in a moment.' }
        } finally {
          window.clearTimeout(timeoutId)
        }

        if (!response.ok) {
          let message = 'Sign in failed.'
          try {
            const errorData = await response.json() as { message?: string }
            if (errorData?.message) {
              message = errorData.message
            }
          } catch {
            if (response.status === 429) {
              message = 'Too many login attempts. Please wait one minute and try again.'
            } else if (response.status >= 500) {
              message = 'Server error while signing in. Please try again shortly.'
            }
          }

          set({
            user: null,
            isAuthenticated: false,
            accessToken: null,
            refreshToken: null,
            accessTokenExpiresAtUtc: null,
            refreshTokenExpiresAtUtc: null
          })
          return { success: false, message }
        }

        const data = await response.json() as LoginApiResponse
        if (!data.success || !data.user || !data.tokens) {
          set({
            user: null,
            isAuthenticated: false,
            accessToken: null,
            refreshToken: null,
            accessTokenExpiresAtUtc: null,
            refreshTokenExpiresAtUtc: null
          })
          return { success: false, message: data.message || 'Invalid username or password' }
        }

        set({
          user: data.user,
          accessToken: data.tokens.accessToken,
          refreshToken: data.tokens.refreshToken,
          accessTokenExpiresAtUtc: data.tokens.accessTokenExpiresAtUtc,
          refreshTokenExpiresAtUtc: data.tokens.refreshTokenExpiresAtUtc,
          isAuthenticated: true
        })
        try {
          localStorage.removeItem('company-storage')
        } catch {
          // ignore storage failures
        }
        return { success: true, message: data.message || 'Login successful' }
      },
      logout: async () => {
        const state = useAuthStore.getState()
        
        // Send logout request to backend in the background
        if (state.refreshToken) {
          try {
            fetch('/api/auth/logout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: state.refreshToken })
            }).catch(() => {})
          } catch {
            // Ignore fetch errors
          }
        }

        // Immediately clear internal state
        set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          accessTokenExpiresAtUtc: null,
          refreshTokenExpiresAtUtc: null
        })
        
        // Clear related storages
        localStorage.removeItem('company-storage')
        localStorage.removeItem('auth-storage')
        localStorage.removeItem('settings-storage')

        // Hard redirect to clear all zustand memory states and prevent shared profile photos / display names
        window.location.href = '/login'
        window.location.reload()
      }
    }),
    {
      name: 'auth-storage'
    }
  )
)
