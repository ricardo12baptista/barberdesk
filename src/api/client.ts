import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
})

// Inject auth token on every request
apiClient.interceptors.request.use((config) => {
  // Read from localStorage directly to avoid circular store import
  const stored = localStorage.getItem('businessdesk-auth')
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
      localStorage.removeItem('businessdesk-auth')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
