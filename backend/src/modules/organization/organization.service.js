import * as repository from './organization.repository.js'

export class ServiceError extends Error { constructor(statusCode, message, errors=null) { super(message); this.statusCode=statusCode; this.errors=errors } }
const clean = value => String(value ?? '').trim().replace(/\s+/g, ' ')
const nullable = (value, max) => { const text=clean(value); if(!text)return null; if(text.length>max)throw new ServiceError(400,'Dữ liệu không hợp lệ.'); return text }
const id = (value, name='Id') => { const number=Number(value); if(!Number.isInteger(number)||number<1)throw new ServiceError(400,`${name} không hợp lệ.`); return number }
const active = value => value === undefined || value === '' ? null : String(value).toLowerCase() === 'true' || value === '1' ? true : String(value).toLowerCase() === 'false' || value === '0' ? false : null
const paging = query => ({ page:Math.max(1,Number(query.page)||1),pageSize:Math.min(100,Math.max(1,Number(query.pageSize)||10)),search:clean(query.search).slice(0,150),isActive:active(query.isActive),sortBy:clean(query.sortBy),sortDirection:clean(query.sortDirection) })
const paged = (result, options) => ({ ...result,page:options.page,pageSize:options.pageSize,totalPages:Math.max(1,Math.ceil(result.total/options.pageSize)) })

export function validateFaculty(payload={}) {
  const facultyCode=clean(payload.facultyCode).toUpperCase(),facultyName=clean(payload.facultyName),errors={}
  if(!facultyCode)errors.facultyCode=['Mã khoa không được để trống.']; else if(facultyCode.length>30)errors.facultyCode=['Mã khoa không được vượt quá 30 ký tự.']; else if(!/^[A-Z0-9_-]+$/.test(facultyCode))errors.facultyCode=['Mã khoa chỉ gồm chữ, số, gạch ngang hoặc gạch dưới.']
  if(!facultyName)errors.facultyName=['Tên khoa không được để trống.']; else if(facultyName.length>150)errors.facultyName=['Tên khoa không được vượt quá 150 ký tự.']
  if(Object.keys(errors).length)throw new ServiceError(400,'Dữ liệu khoa không hợp lệ.',errors)
  return { facultyCode,facultyName,description:nullable(payload.description,500) }
}

export function validateAdministrativeClass(payload={}) {
  const classCode=clean(payload.classCode).toUpperCase(),className=clean(payload.className),errors={}
  if(!classCode)errors.classCode=['Mã lớp không được để trống.']; else if(classCode.length>50)errors.classCode=['Mã lớp không được vượt quá 50 ký tự.']; else if(!/^[A-Z0-9_-]+$/.test(classCode))errors.classCode=['Mã lớp chỉ gồm chữ, số, gạch ngang hoặc gạch dưới.']
  if(!className)errors.className=['Tên lớp không được để trống.']; else if(className.length>100)errors.className=['Tên lớp không được vượt quá 100 ký tự.']
  let facultyId,admissionYear=null,advisorLecturerId=null
  try{facultyId=id(payload.facultyId,'Khoa')}catch{errors.facultyId=['Vui lòng chọn khoa hợp lệ.']}
  if(payload.admissionYear!==undefined&&payload.admissionYear!==null&&payload.admissionYear!==''){admissionYear=Number(payload.admissionYear);if(!Number.isInteger(admissionYear)||admissionYear<1900||admissionYear>2200)errors.admissionYear=['Năm nhập học phải từ 1900 đến 2200.']}
  if(payload.advisorLecturerId!==undefined&&payload.advisorLecturerId!==null&&payload.advisorLecturerId!==''){try{advisorLecturerId=id(payload.advisorLecturerId,'Cố vấn')}catch{errors.advisorLecturerId=['Cố vấn học tập không hợp lệ.']}}
  if(Object.keys(errors).length)throw new ServiceError(400,'Dữ liệu lớp hành chính không hợp lệ.',errors)
  return { classCode,className,facultyId,admissionYear,academicProgram:nullable(payload.academicProgram,150),advisorLecturerId,description:nullable(payload.description,500) }
}

export async function listFaculties(query){const options=paging(query);return paged(await repository.listFaculties(options),options)}
export async function getFaculty(value){const item=await repository.findFaculty(id(value));if(!item)throw new ServiceError(404,'Không tìm thấy khoa.');return item}
export async function createFaculty(payload){const data=validateFaculty(payload);if(await repository.findFacultyByCode(data.facultyCode))throw new ServiceError(409,'Mã khoa đã tồn tại.',{facultyCode:['Mã khoa đã tồn tại.']});return repository.createFaculty(data)}
export async function updateFaculty(value,payload){const facultyId=id(value),current=await repository.findFaculty(facultyId);if(!current)throw new ServiceError(404,'Không tìm thấy khoa.');const data=validateFaculty(payload);if(await repository.findFacultyByCode(data.facultyCode,facultyId))throw new ServiceError(409,'Mã khoa đã tồn tại.',{facultyCode:['Mã khoa đã tồn tại.']});return repository.updateFaculty(facultyId,data)}
export async function setFacultyStatus(value,payload){const facultyId=id(value);if(typeof payload.isActive!=='boolean')throw new ServiceError(400,'Trạng thái không hợp lệ.',{isActive:['Trạng thái phải là true hoặc false.']});const item=await repository.setFacultyStatus(facultyId,payload.isActive);if(!item)throw new ServiceError(404,'Không tìm thấy khoa.');return item}
export async function deleteFaculty(value){const facultyId=id(value),current=await repository.findFaculty(facultyId);if(!current)throw new ServiceError(404,'Không tìm thấy khoa.');if(current.administrativeClassCount>0)throw new ServiceError(409,'Không thể xóa khoa đang có lớp hành chính.');return repository.deleteFaculty(facultyId)}

export async function listClasses(query){let admissionYear=null;if(query.admissionYear){admissionYear=Number(query.admissionYear);if(!Number.isInteger(admissionYear)||admissionYear<1900||admissionYear>2200)throw new ServiceError(400,'Năm nhập học không hợp lệ.')}const options={...paging(query),facultyId:query.facultyId?id(query.facultyId,'Khoa'):null,admissionYear};return paged(await repository.listAdministrativeClasses(options),options)}
export async function getClass(value){const item=await repository.findAdministrativeClass(id(value));if(!item)throw new ServiceError(404,'Không tìm thấy lớp hành chính.');return item}
async function validateClassReferences(data){const faculty=await repository.findFaculty(data.facultyId);if(!faculty)throw new ServiceError(400,'Khoa không tồn tại.',{facultyId:['Khoa không tồn tại.']});if(!faculty.isActive)throw new ServiceError(409,'Không thể sử dụng khoa đã ngừng hoạt động.');if(data.advisorLecturerId&&!await repository.findActiveLecturer(data.advisorLecturerId))throw new ServiceError(400,'Cố vấn học tập phải là giảng viên đang hoạt động.',{advisorLecturerId:['Giảng viên không hợp lệ.']})}
export async function createClass(payload){const data=validateAdministrativeClass(payload);await validateClassReferences(data);if(await repository.findAdministrativeClassByCode(data.classCode))throw new ServiceError(409,'Mã lớp hành chính đã tồn tại.',{classCode:['Mã lớp đã tồn tại.']});return repository.createAdministrativeClass(data)}
export async function updateClass(value,payload){const classId=id(value),current=await repository.findAdministrativeClass(classId);if(!current)throw new ServiceError(404,'Không tìm thấy lớp hành chính.');const data=validateAdministrativeClass(payload);await validateClassReferences(data);if(await repository.findAdministrativeClassByCode(data.classCode,classId))throw new ServiceError(409,'Mã lớp hành chính đã tồn tại.',{classCode:['Mã lớp đã tồn tại.']});return repository.updateAdministrativeClass(classId,data)}
export async function setClassStatus(value,payload){const classId=id(value);if(typeof payload.isActive!=='boolean')throw new ServiceError(400,'Trạng thái không hợp lệ.');const item=await repository.setAdministrativeClassStatus(classId,payload.isActive);if(!item)throw new ServiceError(404,'Không tìm thấy lớp hành chính.');return item}
export async function deleteClass(value){const classId=id(value),current=await repository.findAdministrativeClass(classId);if(!current)throw new ServiceError(404,'Không tìm thấy lớp hành chính.');if(current.studentCount>0)throw new ServiceError(409,'Không thể xóa lớp hành chính đang có sinh viên.');return repository.deleteAdministrativeClass(classId)}
export async function listStudents(value,query){const classId=id(value),current=await repository.findAdministrativeClass(classId);if(!current)throw new ServiceError(404,'Không tìm thấy lớp hành chính.');const options=paging(query);return paged(await repository.listAdministrativeClassStudents(classId,options),options)}
async function assign(studentId,classId){try{return await repository.assignStudent(studentId,classId)}catch(error){
 if(error.code==='STUDENT_NOT_FOUND')throw new ServiceError(404,'Không tìm thấy sinh viên.')
 if(error.code==='STUDENT_INACTIVE')throw new ServiceError(409,'Không thể gán sinh viên đã ngừng hoạt động.')
 if(error.code==='CLASS_NOT_FOUND')throw new ServiceError(404,'Không tìm thấy lớp hành chính.')
 if(error.code==='CLASS_INACTIVE')throw new ServiceError(409,'Không thể gán sinh viên vào lớp đã ngừng hoạt động.')
 throw error
}}
export async function assignStudent(value,payload){return assign(id(payload.studentId,'Sinh viên'),id(value,'Lớp hành chính'))}
export async function removeStudent(value,studentValue){const result=await repository.removeStudent(id(value),id(studentValue,'Sinh viên'));if(!result)throw new ServiceError(404,'Sinh viên không thuộc lớp hành chính này.');return result}
export async function moveStudent(studentValue,payload){const studentId=id(studentValue,'Sinh viên');if(payload.administrativeClassId===null||payload.administrativeClassId===''){if(!await repository.findStudent(studentId))throw new ServiceError(404,'Không tìm thấy sinh viên.');return repository.unassignStudent(studentId)}return assign(studentId,id(payload.administrativeClassId,'Lớp hành chính'))}
