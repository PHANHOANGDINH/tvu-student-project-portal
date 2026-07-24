import { request } from './http'
export const listLecturerTopicRounds = () => request('/lecturer/topic-rounds')
export const createTopicRound = data => request('/lecturer/topic-rounds', { method: 'POST', body: JSON.stringify(data) })
export const updateTopicRoundStatus = (id, status) => request(`/lecturer/topic-rounds/${id}/status`, {
  method: 'PATCH', body: JSON.stringify({ status }),
})
export const listStudentTopicRounds = () => request('/student/topic-rounds')
