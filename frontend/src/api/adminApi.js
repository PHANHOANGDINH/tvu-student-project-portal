import { request } from './http'

function toQuery(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  })
  return query.toString()
}

export function getUsers(params = {}) {
  const query = toQuery(params)
  return request(`/api/users${query ? `?${query}` : ''}`)
}

export function getUserById(id) {
  return request(`/api/users/${id}`)
}

export function createUser(data) {
  return request('/api/users', { method: 'POST', body: JSON.stringify(data) })
}

export function updateUser(id, data) {
  return request(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export function updateUserStatus(id, isActive) {
  return request(`/api/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) })
}

export function resetUserPassword(id, data) {
  return request(`/api/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify(data) })
}
