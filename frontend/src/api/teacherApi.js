import { request } from './http'

export function getTeacherWorkspaceApi() {
  return request('/api/teacher/workspace')
}

export function getTeacherProjectsApi(params = {}) {
  const query = new URLSearchParams({
    page: String(params.page || 1),
    limit: String(params.limit || 10),
    search: params.search || '',
    status: params.status || ''
  })

  return request(`/api/teacher/projects?${query.toString()}`)
}

export function getTeacherProjectDetailApi(id) {
  return request(`/api/teacher/projects/${id}`)
}

export function createTeacherProjectApi(payload) {
  return request('/api/teacher/projects', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export function updateTeacherProjectApi(id, payload) {
  return request(`/api/teacher/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
}

export function deleteTeacherProjectApi(id) {
  return request(`/api/teacher/projects/${id}`, {
    method: 'DELETE'
  })
}

export function getTeacherProjectRegistrationsApi(projectId, params = {}) {
  const query = new URLSearchParams({
    page: String(params.page || 1),
    limit: String(params.limit || 10),
    status: params.status || ''
  })

  return request(
    `/api/teacher/projects/${projectId}/registrations?${query.toString()}`
  )
}

export function approveTeacherProjectRegistrationApi(registrationId, reviewNote = '') {
  return request(`/api/teacher/projects/registrations/${registrationId}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ reviewNote })
  })
}

export function rejectTeacherProjectRegistrationApi(registrationId, reviewNote = '') {
  return request(`/api/teacher/projects/registrations/${registrationId}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reviewNote })
  })
}

export function getTeacherProgressReportsApi(params = {}) {
  const query = new URLSearchParams({
    page: String(params.page || 1),
    limit: String(params.limit || 10),
    search: params.search || '',
    status: params.status || ''
  })

  return request(`/api/teacher/progress?${query.toString()}`)
}

export function getTeacherProgressReportDetailApi(id) {
  return request(`/api/teacher/progress/${id}`)
}

export function reviewTeacherProgressReportApi(id, payload) {
  return request(`/api/teacher/progress/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  })
}

export function getTeacherFinalSubmissionsApi(params = {}) {
  const query = new URLSearchParams({
    page: String(params.page || 1),
    limit: String(params.limit || 10),
    search: params.search || '',
    status: params.status || ''
  })

  return request(`/api/teacher/final-submissions?${query.toString()}`)
}

export function getTeacherFinalSubmissionDetailApi(id) {
  return request(`/api/teacher/final-submissions/${id}`)
}

export function reviewTeacherFinalSubmissionApi(id, payload) {
  return request(`/api/teacher/final-submissions/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  })
}