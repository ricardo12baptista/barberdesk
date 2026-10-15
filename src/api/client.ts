/// <reference types="vite/client" />
import axios from 'axios'

export const getApiBaseUrl = (configuredBaseUrl?: string): string => {
  const baseUrl = configuredBaseUrl?.replace(/\/+$/, '') ?? ''
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`
}

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(import.meta.env.VITE_API_URL),
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
})

// Inject auth token on every request
apiClient.interceptors.request.use((config) => {
  // Read from localStorage directly to avoid circular store import
  const stored = localStorage.getItem('barberdesk-auth')
  if (stored) {
    const parsed = JSON.parse(stored) as { state?: { token?: string } }
    const token = parsed?.state?.token
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Global error handling
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('barberdesk-auth')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
