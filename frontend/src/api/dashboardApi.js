import { request } from './http'

export const getRoleDashboard = role => request(`/${role}/dashboard`)

const endpoints = {
  admin: ['summary', 'accounts-by-role', 'course-classes-by-semester', 'students-by-faculty', 'topics-by-status', 'submissions-over-time', 'course-classes-by-course', 'recent-activities'],
  lecturer: ['summary', 'group-progress', 'submissions-by-status', 'topics-by-status', 'submissions-over-time', 'grade-distribution', 'milestone-completion'],
  student: ['summary', 'project-progress', 'grade-criteria', 'upcoming-deadlines', 'recent-feedback']
}

const camel = value => value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())

export async function getDashboardAnalytics(role, filters = {}) {
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '' && value != null)).toString()
  const pairs = await Promise.all(endpoints[role].map(async endpoint => {
    const response = await request(`/${role}/dashboard/${endpoint}${query ? `?${query}` : ''}`)
    return [camel(endpoint), response.data]
  }))
  return Object.fromEntries(pairs)
}
