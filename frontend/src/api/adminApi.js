import { buildApiUrl, request } from './http'

function toQuery(params = {}) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })

  return query.toString()
}

// DASHBOARD
export function getDashboardApi() {
  return request('/api/admin/dashboard')
}

// USERS - canonical Admin user management API
export function getUsers(params = {}) {
  const query = toQuery(params)
  return request(`/api/users${query ? `?${query}` : ''}`)
}

export function getUserById(id) {
  return request(`/api/users/${id}`)
}

export function createUser(data) {
  return request('/api/users', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export function updateUser(id, data) {
  return request(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export function updateUserStatus(id, isActive) {
  return request(`/api/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive })
  })
}

export function resetUserPassword(id, data) {
  return request(`/api/users/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// Legacy names used by dashboard/classes pages that still expect the old response shape.
export function getUsersApi() {
  return request('/api/admin/users?limit=100')
}

export function getUserDetailApi(id) {
  return request(`/api/admin/users/${id}`)
}
export const createUserApi = createUser
export const updateUserApi = updateUser
export const resetUserPasswordApi = resetUserPassword

export function lockUserApi(id) {
  return updateUserStatus(id, false)
}

export function unlockUserApi(id) {
  return updateUserStatus(id, true)
}

export function deleteUserApi(id) {
  return request(`/api/admin/users/${id}`, {
    method: 'DELETE'
  })
}

export async function importUsersExcelApi(file, importType) {
  const token = localStorage.getItem('access_token')
  const formData = new FormData()

  formData.append('file', file)
  formData.append('importType', importType)

  const response = await fetch(
    buildApiUrl('/admin/users/import-excel'),
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    }
  )

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message || `Lỗi import Excel: ${response.status}`)
  }

  return data
}

// CLASSES
export function getClassesApi() {
  return request('/api/admin/classes?limit=100')
}

export function getClassDetailApi(id) {
  return request(`/api/admin/classes/${id}`)
}

export function createClassApi(payload) {
  return request('/api/admin/classes', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export function updateClassApi(id, payload) {
  return request(`/api/admin/classes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
}

export function lockClassApi(id) {
  return request(`/api/admin/classes/${id}/lock`, {
    method: 'PATCH'
  })
}

export function unlockClassApi(id) {
  return request(`/api/admin/classes/${id}/unlock`, {
    method: 'PATCH'
  })
}

export function getClassStudentsApi(classId, params = {}) {
  const page = params.page || 1
  const limit = params.limit || 10
  const search = params.search || ''

  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    search
  })

  return request(`/api/admin/classes/${classId}/students?${query.toString()}`)
}

export function addClassStudentApi(classId, studentId) {
  return request(`/api/admin/classes/${classId}/students`, {
    method: 'POST',
    body: JSON.stringify({ studentId })
  })
}

export function removeClassStudentApi(classId, studentId) {
  return request(`/api/admin/classes/${classId}/students/${studentId}`, {
    method: 'DELETE'
  })
}
