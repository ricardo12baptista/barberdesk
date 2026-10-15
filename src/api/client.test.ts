import { describe, expect, it } from 'vitest'
import { apiClient, getApiBaseUrl } from './client'

describe('API client', () => {
  it('always includes the /api prefix for local and configured backend URLs', () => {
    expect(getApiBaseUrl()).toBe('/api')
    expect(getApiBaseUrl('http://localhost:3000')).toBe('http://localhost:3000/api')
    expect(getApiBaseUrl('https://api.example.test/api/')).toBe('https://api.example.test/api')
  })

  it('uses the normalized API base URL for requests', () => {
    expect(apiClient.defaults.baseURL).toBe(getApiBaseUrl(import.meta.env.VITE_API_URL))
  })
})
