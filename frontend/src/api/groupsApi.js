import { request } from './http'
export const listGroups=(classId)=>request(`/course-classes/${classId}/groups`)
export const createGroup=(classId,data)=>request(`/course-classes/${classId}/groups`,{method:'POST',body:JSON.stringify(data)})
export const getMyGroup=(classId)=>request(`/groups/my-group${classId?`?courseClassId=${classId}`:''}`)
export const addGroupMember=(id,studentId)=>request(`/groups/${id}/members`,{method:'POST',body:JSON.stringify({studentId})})
export const removeGroupMember=(id,studentId)=>request(`/groups/${id}/members/${studentId}`,{method:'DELETE'})
export const transferGroupLeader=(id,studentId)=>request(`/groups/${id}/leader`,{method:'PATCH',body:JSON.stringify({studentId})})
export const getTopic=(groupId)=>request(`/groups/${groupId}/topic-registration`)
export const saveTopic=(groupId,data,exists=false)=>request(`/groups/${groupId}/topic-registration`,{method:exists?'PUT':'POST',body:JSON.stringify(data)})
export const listLecturerTopics=(status='')=>request(`/lecturer/topic-registrations${status?`?status=${status}`:''}`)
export const reviewTopic=(id,data)=>request(`/lecturer/topic-registrations/${id}/review`,{method:'PATCH',body:JSON.stringify(data)})

export const getLecturerTopic=id=>request(`/lecturer/topic-registrations/${id}`)
