import { clearAuth } from '../utils/auth'

const DEFAULT_API_BASE_URL = 'http://localhost:5000/api'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '')

export function buildApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (API_BASE_URL.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    return `${API_BASE_URL}${normalizedPath.slice('/api'.length)}`
  }

  return `${API_BASE_URL}${normalizedPath}`
}

export async function request(path, options = {}) {
  const token = localStorage.getItem('access_token')

  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {})
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers
  })

  const data = await response.json().catch(() => null)

  if (response.status === 401 && !path.includes('/auth/login')) {
    clearAuth()

    if (window.location.pathname !== '/login') {
      window.location.assign('/login')
    }
  }

  if (!response.ok) {
    const error = new Error(data?.message || data?.error || `API error: ${response.status}`)
    error.status = response.status
    error.errors = data?.errors || null
    throw error
  }

  return data
}
