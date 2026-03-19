import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'
import App from './App'
import './index.css'

type PersistedAuthState = {
  user: { username: string } | null
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  accessTokenExpiresAtUtc: string | null
  refreshTokenExpiresAtUtc: string | null
}

const AUTH_STORAGE_KEY = 'auth-storage'

function readPersistedAuthState(): PersistedAuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { state?: PersistedAuthState }
    return parsed.state ?? null
  } catch {
    return null
  }
}

function writePersistedAuthState(state: PersistedAuthState) {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) as Record<string, unknown> : {}
    parsed.state = state
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed))
  } catch {
    // ignore storage failures
  }
}

function clearPersistedAuthState() {
  writePersistedAuthState({
    user: null,
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    accessTokenExpiresAtUtc: null,
    refreshTokenExpiresAtUtc: null
  })
}

function installApiAuthInterceptor() {
  const originalFetch = window.fetch.bind(window)
  let refreshPromise: Promise<string | null> | null = null

  const isApiRequest = (url: string) => {
    if (url.startsWith('/api/')) return true
    try {
      const u = new URL(url, window.location.origin)
      return u.pathname.startsWith('/api/')
    } catch {
      return false
    }
  }

  const tryRefreshToken = async (): Promise<string | null> => {
    const auth = readPersistedAuthState()
    if (!auth?.refreshToken) return null

    const resp = await originalFetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: auth.refreshToken })
    })

    if (!resp.ok) {
      clearPersistedAuthState()
      return null
    }

    const json = await resp.json() as {
      success: boolean
      tokens?: {
        accessToken: string
        accessTokenExpiresAtUtc: string
        refreshToken: string
        refreshTokenExpiresAtUtc: string
      }
    }

    if (!json.success || !json.tokens) {
      clearPersistedAuthState()
      return null
    }

    writePersistedAuthState({
      ...(auth ?? { user: null, isAuthenticated: false }),
      isAuthenticated: true,
      accessToken: json.tokens.accessToken,
      refreshToken: json.tokens.refreshToken,
      accessTokenExpiresAtUtc: json.tokens.accessTokenExpiresAtUtc,
      refreshTokenExpiresAtUtc: json.tokens.refreshTokenExpiresAtUtc
    })

    return json.tokens.accessToken
  }

  const getRefreshedAccessToken = async (): Promise<string | null> => {
    if (!refreshPromise) {
      refreshPromise = tryRefreshToken().finally(() => { refreshPromise = null })
    }
    return refreshPromise
  }

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const requestUrl = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url

    const apiRequest = isApiRequest(requestUrl)
    const auth = readPersistedAuthState()

    const headers = new Headers(init?.headers ?? {})
    if (apiRequest && auth?.accessToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${auth.accessToken}`)
    }

    const firstResponse = await originalFetch(input, { ...init, headers })

    const authRoute = requestUrl.includes('/api/auth/login') || requestUrl.includes('/api/auth/refresh')
    if (!apiRequest || authRoute || firstResponse.status !== 401) return firstResponse

    const newAccessToken = await getRefreshedAccessToken()
    if (!newAccessToken) return firstResponse

    const retryHeaders = new Headers(init?.headers ?? {})
    retryHeaders.set('Authorization', `Bearer ${newAccessToken}`)
    return originalFetch(input, { ...init, headers: retryHeaders })
  }

  axios.interceptors.request.use((config) => {
    const requestUrl = config.url ?? ''
    if (!isApiRequest(requestUrl)) return config

    const auth = readPersistedAuthState()
    if (auth?.accessToken) {
      config.headers = config.headers ?? {}
      ;(config.headers as Record<string, string>).Authorization = `Bearer ${auth.accessToken}`
    }

    return config
  })

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error?.response?.status
      const originalRequest = error?.config
      const requestUrl = originalRequest?.url ?? ''
      const authRoute = requestUrl.includes('/api/auth/login') || requestUrl.includes('/api/auth/refresh')

      if (status !== 401 || authRoute || !originalRequest || originalRequest._retry) {
        return Promise.reject(error)
      }

      originalRequest._retry = true
      const newAccessToken = await getRefreshedAccessToken()
      if (!newAccessToken) {
        return Promise.reject(error)
      }

      originalRequest.headers = originalRequest.headers ?? {}
      ;(originalRequest.headers as Record<string, string>).Authorization = `Bearer ${newAccessToken}`
      return axios(originalRequest)
    }
  )
}

installApiAuthInterceptor()

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
