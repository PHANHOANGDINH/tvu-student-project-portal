import * as service from './organization.service.js'
import { sendError, sendSuccess } from '../../utils/apiResponse.util.js'

const handler = (action,{statusCode=200,message='Thao tác thành công.'}={}) => async(req,res,next)=>{
  try { const data=await action(req);return sendSuccess(res,{statusCode,message,data}) }
  catch(error){if(error.statusCode)return sendError(res,{statusCode:error.statusCode,message:error.message,errors:error.errors});return next(error)}
}

export const listFaculties=handler(req=>service.listFaculties(req.query),{message:'Lấy danh sách khoa thành công.'})
export const getFaculty=handler(req=>service.getFaculty(req.params.id),{message:'Lấy thông tin khoa thành công.'})
export const createFaculty=handler(req=>service.createFaculty(req.body),{statusCode:201,message:'Tạo khoa thành công.'})
export const updateFaculty=handler(req=>service.updateFaculty(req.params.id,req.body),{message:'Cập nhật khoa thành công.'})
export const setFacultyStatus=handler(req=>service.setFacultyStatus(req.params.id,req.body),{message:'Cập nhật trạng thái khoa thành công.'})
export const deleteFaculty=handler(req=>service.deleteFaculty(req.params.id),{message:'Xóa khoa thành công.'})
export const listClasses=handler(req=>service.listClasses(req.query),{message:'Lấy danh sách lớp hành chính thành công.'})
export const getClass=handler(req=>service.getClass(req.params.id),{message:'Lấy thông tin lớp hành chính thành công.'})
export const createClass=handler(req=>service.createClass(req.body),{statusCode:201,message:'Tạo lớp hành chính thành công.'})
export const updateClass=handler(req=>service.updateClass(req.params.id,req.body),{message:'Cập nhật lớp hành chính thành công.'})
export const setClassStatus=handler(req=>service.setClassStatus(req.params.id,req.body),{message:'Cập nhật trạng thái lớp hành chính thành công.'})
export const deleteClass=handler(req=>service.deleteClass(req.params.id),{message:'Xóa lớp hành chính thành công.'})
export const listStudents=handler(req=>service.listStudents(req.params.id,req.query),{message:'Lấy danh sách sinh viên thành công.'})
export const assignStudent=handler(req=>service.assignStudent(req.params.id,req.body),{statusCode:201,message:'Gán hoặc chuyển sinh viên thành công.'})
export const removeStudent=handler(req=>service.removeStudent(req.params.id,req.params.studentId),{message:'Đã xóa sinh viên khỏi lớp hành chính.'})
export const moveStudent=handler(req=>service.moveStudent(req.params.studentId,req.body),{message:'Cập nhật lớp hành chính của sinh viên thành công.'})
