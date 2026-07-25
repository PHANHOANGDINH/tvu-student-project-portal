import { request } from './http'

function query(params = {}) {
  return new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined).map(([key, value]) => [key, String(value)])).toString()
}
export const getStudentWorkspaceApi = () => request('/api/student/workspace')
export const getStudentProjectsApi = (params) => request(`/api/student/projects?${query(params)}`)
export const getStudentProjectApi = (id) => request(`/api/student/projects/${id}`)
export const registerStudentProjectApi = (id, note) => request(`/api/student/projects/${id}/register`, { method: 'POST', body: JSON.stringify({ note }) })
export const getStudentRegistrationsApi = (params) => request(`/api/student/projects/my-registrations?${query(params)}`)
export const cancelStudentRegistrationApi = (id) => request(`/api/student/projects/registrations/${id}/cancel`, { method: 'PATCH' })
export const getStudentProgressApi = (params) => request(`/api/student/progress?${query(params)}`)
export const createStudentProgressApi = (payload) => request('/api/student/progress', { method: 'POST', body: JSON.stringify(payload) })
export const updateStudentProgressApi = (id, payload) => request(`/api/student/progress/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
export const deleteStudentProgressApi = (id) => request(`/api/student/progress/${id}`, { method: 'DELETE' })
export const getStudentFinalsApi = (params) => request(`/api/student/final-submissions?${query(params)}`)
export const getStudentFinalApi = (id) => request(`/api/student/final-submissions/${id}`)
export const createStudentFinalApi = (payload) => request('/api/student/final-submissions', { method: 'POST', body: JSON.stringify(payload) })
export const updateStudentFinalApi = (id, payload) => request(`/api/student/final-submissions/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
