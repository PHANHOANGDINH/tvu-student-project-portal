import { buildApiUrl,request } from './http'
const token=()=>localStorage.getItem('access_token')||''
async function blob(path){const response=await fetch(buildApiUrl(path),{headers:{Authorization:`Bearer ${token()}`}});if(!response.ok)throw new Error('Không thể tải file CSV.');return response.blob()}
export const downloadLecturerTemplate=()=>blob('/admin/lecturers/import-template')
export const exportLecturers=()=>blob('/admin/lecturers/export')
export async function previewLecturers(file){const form=new FormData();form.append('file',file);const response=await fetch(buildApiUrl('/admin/lecturers/import-preview'),{method:'POST',headers:{Authorization:`Bearer ${token()}`},body:form});const data=await response.json();if(!response.ok)throw new Error(data.message||'Không thể kiểm tra CSV.');return data}
export const confirmLecturers=previewId=>request('/admin/lecturers/import-confirm',{method:'POST',body:JSON.stringify({previewId,mode:'atomic'})})
