import { request } from './http'

function toQuery(params = {}) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })

  return query.toString()
}

function withQuery(path, params) {
  const query = toQuery(params)
  return `${path}${query ? `?${query}` : ''}`
}

function crud(path) {
  return {
    list: (params = {}) => request(withQuery(path, params)),
    get: (id) => request(`${path}/${id}`),
    create: (data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`${path}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    status: (id, isActive) => request(`${path}/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) })
  }
}

export const academicYearsApi = crud('/api/academic-years')
export const semestersApi = crud('/api/semesters')
export const subjectsApi = crud('/api/subjects')

export function getCourseClasses(params = {}) {
  return request(withQuery('/api/course-classes', params))
}

export function getCourseClass(id) {
  return request(`/api/course-classes/${id}`)
}

export function createCourseClass(data) {
  return request('/api/course-classes', { method: 'POST', body: JSON.stringify(data) })
}

export function updateCourseClass(id, data) {
  return request(`/api/course-classes/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export function updateCourseClassStatus(id, status) {
  return request(`/api/course-classes/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
}

export function assignCourseClassLecturer(id, lecturerId) {
  return request(`/api/course-classes/${id}/lecturer`, { method: 'PUT', body: JSON.stringify({ lecturerId }) })
}

export function getCourseClassStudents(id, params = {}) {
  return request(withQuery(`/api/course-classes/${id}/students`, params))
}

export function addCourseClassStudents(id, studentIds) {
  return request(`/api/course-classes/${id}/students`, { method: 'POST', body: JSON.stringify({ studentIds }) })
}

export function removeCourseClassStudent(id, studentId) {
  return request(`/api/course-classes/${id}/students/${studentId}`, { method: 'DELETE' })
}

export function getLecturerCourseClasses(params = {}) {
  return request(withQuery('/api/lecturer/course-classes', params))
}

export function getLecturerCourseClass(id) {
  return request(`/api/lecturer/course-classes/${id}`)
}

export function getLecturerCourseClassStudents(id, params = {}) {
  return request(withQuery(`/api/lecturer/course-classes/${id}/students`, params))
}

export function getStudentCourseClasses(params = {}) {
  return request(withQuery('/api/student/course-classes', params))
}

export function getStudentCourseClass(id) {
  return request(`/api/student/course-classes/${id}`)
}
