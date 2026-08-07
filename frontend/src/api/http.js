import { clearAuth } from '../utils/auth'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '')

export function buildApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (API_BASE_URL.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    return `${API_BASE_URL}${normalizedPath.slice(4)}`
  }

  return `${API_BASE_URL}${normalizedPath}`
}

export async function request(path, options = {}) {
  const token = localStorage.getItem('access_token')

  const headers = {
    Accept: 'application/json',
    ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {})
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(buildApiUrl(path), { ...options, headers })
  } catch (error) {
    console.error('Không thể kết nối API:', error)
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng thử lại.', { cause: error })
  }

  const data = await response.json().catch(() => null)

  if (response.status === 401 && !path.includes('/auth/login')) {
    const isDashboardRequest = /^\/(admin|lecturer|student)\/dashboard(?:\/|$)/.test(path)

    if (!isDashboardRequest) clearAuth()

    if (!isDashboardRequest && window.location.pathname !== '/login') {
      window.location.assign('/login')
    }
  }

  if (!response.ok) {
    const error = new Error(data?.message || data?.error || `Lỗi API: ${response.status}`)
    error.status = response.status
    error.errors = data?.errors || null
    throw error
  }

  return data
}
