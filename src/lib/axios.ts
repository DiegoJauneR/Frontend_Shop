import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// In-memory token — always read synchronously by the request interceptor
let _token: string | null = null

export function setAuthToken(token: string | null) {
  _token = token
}

// Restore token from persisted storage on app start
;(function restoreToken() {
  try {
    const stored = localStorage.getItem('auth-storage')
    if (stored) {
      const parsed = JSON.parse(stored) as { state?: { token?: string } }
      const token = parsed?.state?.token
      if (token) _token = token
    }
  } catch {
    // ignore malformed storage
  }
})()

// Request interceptor — reads in-memory token, guaranteed synchronous
api.interceptors.request.use(
  (config) => {
    if (_token) {
      config.headers.Authorization = `Bearer ${_token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — clear auth on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setAuthToken(null)
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
