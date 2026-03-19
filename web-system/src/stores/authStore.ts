import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  username: string
  role: 'superadmin' | 'tester'
  canAccessFs: boolean
  canAccessPayroll: boolean
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  accessTokenExpiresAtUtc: string | null
  refreshTokenExpiresAtUtc: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
}

interface LoginApiResponse {
  success: boolean
  message: string
  user: {
    username: string
    role: 'superadmin' | 'tester'
    canAccessFs: boolean
    canAccessPayroll: boolean
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
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        })

        if (!response.ok) {
          set({
            user: null,
            isAuthenticated: false,
            accessToken: null,
            refreshToken: null,
            accessTokenExpiresAtUtc: null,
            refreshTokenExpiresAtUtc: null
          })
          return false
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
          return false
        }

        set({
          user: data.user,
          accessToken: data.tokens.accessToken,
          refreshToken: data.tokens.refreshToken,
          accessTokenExpiresAtUtc: data.tokens.accessTokenExpiresAtUtc,
          refreshTokenExpiresAtUtc: data.tokens.refreshTokenExpiresAtUtc,
          isAuthenticated: true
        })
        return true
      },
      logout: async () => {
        const state = useAuthStore.getState()
        try {
          if (state.refreshToken) {
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(state.accessToken ? { Authorization: `Bearer ${state.accessToken}` } : {})
              },
              body: JSON.stringify({ refreshToken: state.refreshToken })
            })
          }
        } catch {
          // best-effort logout; local cleanup still runs
        }
        set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          accessTokenExpiresAtUtc: null,
          refreshTokenExpiresAtUtc: null
        })
      }
    }),
    {
      name: 'auth-storage'
    }
  )
)
