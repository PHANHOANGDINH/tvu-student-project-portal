import { buildApiUrl, request } from './http'
export const listLecturerTopicRounds = () => request('/lecturer/topic-rounds')
export const createTopicRound = data => request('/lecturer/topic-rounds', { method: 'POST', body: JSON.stringify(data) })
export const updateTopicRound=(id,data)=>request(`/lecturer/topic-rounds/${id}`,{method:'PUT',body:JSON.stringify(data)})
export const updateTopicRoundStatus = (id, status) => request(`/lecturer/topic-rounds/${id}/status`, {
  method: 'PATCH', body: JSON.stringify({ status }),
})
export const listStudentTopicRounds = () => request('/student/topic-rounds')

export const listRoundFiles=(role,id)=>request(`/${role}/topic-rounds/${id}/files`)
export const uploadRoundFile=(id,file)=>{const body=new FormData();body.append('file',file);return request(`/lecturer/topic-rounds/${id}/files`,{method:'POST',body})}
export const deleteRoundFile=id=>request(`/lecturer/topic-rounds/files/${id}`,{method:'DELETE'})
export const registerTopic=(id,data)=>request(`/student/topic-rounds/${id}/register`,{method:'POST',body:JSON.stringify(data)})
export const updateTopicRegistration=(id,data)=>request(`/student/topic-rounds/${id}/registration`,{method:'PUT',body:JSON.stringify(data)})
export async function downloadRoundFile(role,id,name){const response=await fetch(buildApiUrl(`/${role}/topic-rounds/files/${id}/download`),{headers:{Authorization:`Bearer ${localStorage.getItem('access_token')||''}`}});if(!response.ok)throw new Error('Không thể tải file.');const blob=await response.blob(),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.click();URL.revokeObjectURL(url)}