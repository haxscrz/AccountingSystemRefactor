import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  username: string
  role: 'admin' | 'accountant' | 'payroll'
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (username: string, password: string) => {
        // TODO: Replace with actual API call
        // For now, hardcoded demo credentials
        if (username === 'admin' && password === 'admin') {
          set({ 
            user: { username: 'admin', role: 'admin' },
            isAuthenticated: true 
          })
          return true
        }
        return false
      },
      logout: () => {
        set({ user: null, isAuthenticated: false })
      }
    }),
    {
      name: 'auth-storage'
    }
  )
)
