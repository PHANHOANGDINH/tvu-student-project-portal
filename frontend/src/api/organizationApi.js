import { request } from './http'
const query=params=>{const q=new URLSearchParams();Object.entries(params||{}).forEach(([k,v])=>{if(v!==''&&v!==null&&v!==undefined)q.set(k,v)});return q.toString()}
const base=resource=>`/admin/${resource}`
export const listOrganization=(resource,params={})=>request(`${base(resource)}?${query(params)}`)
export const createOrganization=(resource,data)=>request(base(resource),{method:'POST',body:JSON.stringify(data)})
export const updateOrganization=(resource,id,data)=>request(`${base(resource)}/${id}`,{method:'PUT',body:JSON.stringify(data)})
export const setOrganizationStatus=(resource,id,isActive)=>request(`${base(resource)}/${id}/status`,{method:'PATCH',body:JSON.stringify({isActive})})
export const deleteOrganization=(resource,id)=>request(`${base(resource)}/${id}`,{method:'DELETE'})
export const listAdministrativeStudents=(id,params={})=>request(`${base('administrative-classes')}/${id}/students?${query(params)}`)
export const assignAdministrativeStudent=(id,studentId)=>request(`${base('administrative-classes')}/${id}/students`,{method:'POST',body:JSON.stringify({studentId})})
export const removeAdministrativeStudent=(id,studentId)=>request(`${base('administrative-classes')}/${id}/students/${studentId}`,{method:'DELETE'})
