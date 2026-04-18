import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach JWT token from Zustand persisted storage
api.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem('auth-storage')
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { state?: { token?: string } }
        const token = parsed?.state?.token
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch {
        // malformed storage, ignore
      }
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
      localStorage.removeItem('auth-storage')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)
