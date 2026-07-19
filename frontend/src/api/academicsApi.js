import { request } from './http'
const query=(params)=>{const q=new URLSearchParams();Object.entries(params||{}).forEach(([k,v])=>{if(v!==''&&v!==null&&v!==undefined)q.set(k,v)});return q.toString()}
export const listAcademic=(resource,params={})=>request(`/${resource}?${query(params)}`)
export const getAcademic=(resource,id)=>request(`/${resource}/${id}`)
export const createAcademic=(resource,data)=>request(`/${resource}`,{method:'POST',body:JSON.stringify(data)})
export const updateAcademic=(resource,id,data)=>request(`/${resource}/${id}`,{method:'PUT',body:JSON.stringify(data)})
export const setAcademicStatus=(resource,id,isActive)=>request(`/${resource}/${id}/status`,{method:'PATCH',body:JSON.stringify({isActive})})
export const listStudentCourseClasses=(params={})=>request(`/student/course-classes?${query(params)}`)
export const getStudentCourseClass=(id)=>request(`/student/course-classes/${id}`)