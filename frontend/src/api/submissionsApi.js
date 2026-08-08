import { buildApiUrl, request } from './http'

export const studentSubmissionWorkflow = type => request(`/student/submission-workflow?type=${encodeURIComponent(type)}`)
export const currentSubmission = id => request(`/student/submission-requirements/${id}/submission`)
export const studentSubmission = id => request(`/student/submissions/${id}`)
export const studentHistory = id => request(`/student/submissions/${id}/history`)
export const lecturerRequirementSubmissions = id => request(`/lecturer/submission-requirements/${id}/submissions`)
export const lecturerSubmission = id => request(`/lecturer/submissions/${id}`)
export const lecturerHistory = id => request(`/lecturer/submissions/${id}/history`)

export function uploadSubmission(id, form, onProgress) {
  return new Promise((resolve, reject) => {
    const requestUpload = new XMLHttpRequest()
    requestUpload.open('POST', buildApiUrl(`/student/submission-requirements/${id}/submissions`))
    requestUpload.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('access_token') || ''}`)
    requestUpload.upload.onprogress = event => event.lengthComputable && onProgress?.(Math.round(event.loaded * 100 / event.total))
    requestUpload.onload = () => {
      let data
      try { data = JSON.parse(requestUpload.responseText) } catch { data = null }
      requestUpload.status >= 200 && requestUpload.status < 300 ? resolve(data) : reject(new Error(data?.message || 'Upload thất bại'))
    }
    requestUpload.onerror = () => reject(new Error('Không thể kết nối máy chủ'))
    requestUpload.send(form)
  })
}

export async function downloadSubmissionFile(id, role = 'lecturer') {
  const response = await fetch(buildApiUrl(`/${role}/submission-files/${id}/download`), { headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` } })
  if (!response.ok) throw new Error('Không thể tải file')
  return response.blob()
}
