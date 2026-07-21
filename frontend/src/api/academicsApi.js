import { buildApiUrl,request } from './http'
const query=(params)=>{const q=new URLSearchParams();Object.entries(params||{}).forEach(([k,v])=>{if(v!==''&&v!==null&&v!==undefined)q.set(k,v)});return q.toString()}
export const listAcademic=(resource,params={})=>request(`/${resource}?${query(params)}`)
export const getAcademic=(resource,id)=>request(`/${resource}/${id}`)
export const createAcademic=(resource,data)=>request(`/${resource}`,{method:'POST',body:JSON.stringify(data)})
export const updateAcademic=(resource,id,data)=>request(`/${resource}/${id}`,{method:'PUT',body:JSON.stringify(data)})
export const setAcademicStatus=(resource,id,isActive)=>request(`/${resource}/${id}/status`,{method:'PATCH',body:JSON.stringify({isActive})})
export const listStudentCourseClasses=(params={})=>request(`/student/course-classes?${query(params)}`)
export const getStudentCourseClass=(id)=>request(`/student/course-classes/${id}`)
export const previewStudentCsv=(courseClassId,file)=>{const body=new FormData();body.append('courseClassId',courseClassId);body.append('file',file);return request('/admin/students/import-preview',{method:'POST',body})}
export const confirmStudentCsv=(previewId,courseClassId)=>request('/admin/students/import-confirm',{method:'POST',body:JSON.stringify({previewId,courseClassId,mode:'atomic'})})
export const bulkEnrollStudents=(courseClassId,studentIds)=>request(`/course-classes/${courseClassId}/students/bulk`,{method:'POST',body:JSON.stringify({studentIds})})
export const listCourseClassStudents=(courseClassId,params={})=>request(`/course-classes/${courseClassId}/students?${query(params)}`)
async function download(path){const response=await fetch(buildApiUrl(path),{headers:{Authorization:`Bearer ${localStorage.getItem('access_token')||''}`}});if(!response.ok){const data=await response.json().catch(()=>null);throw new Error(data?.message||'Không thể tải file')}return response.blob()}
export const downloadStudentImportTemplate=()=>download('/admin/students/import-template')
export const exportCourseClassStudents=(courseClassId)=>download(`/course-classes/${courseClassId}/students/export`)
