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
  token: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
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
  token: string | null
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      login: async (username: string, password: string) => {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        })

        if (!response.ok) {
          set({ user: null, isAuthenticated: false, token: null })
          return false
        }

        const data = await response.json() as LoginApiResponse
        if (!data.success || !data.user || !data.token) {
          set({ user: null, isAuthenticated: false, token: null })
          return false
        }

        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true
        })
        return true
      },
      logout: () => {
        set({ user: null, isAuthenticated: false, token: null })
      }
    }),
    {
      name: 'auth-storage'
    }
  )
)
