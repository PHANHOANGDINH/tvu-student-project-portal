import { sendError,sendSuccess } from '../../utils/apiResponse.util.js'
import * as service from './courseClassLecturers.service.js'
const send=(res,r)=>r.success?sendSuccess(res,{statusCode:r.statusCode,message:r.message,data:r.data}):sendError(res,{statusCode:r.statusCode,message:r.message})
const action=fn=>async(req,res)=>{try{return send(res,await fn(req))}catch(error){console.error(error);return sendError(res,{statusCode:500,message:'Không thể xử lý phân công giảng viên'})}}
export const list=action(req=>service.list(req.params.courseClassId))
export const assign=action(req=>service.assign(req.params.courseClassId,req.body,req.user.id))
export const update=action(req=>service.update(req.params.courseClassId,req.params.lecturerId,req.body))
export const remove=action(req=>service.remove(req.params.courseClassId,req.params.lecturerId))
export const bulk=action(req=>service.bulk(req.params.courseClassId,req.body,req.user.id))
