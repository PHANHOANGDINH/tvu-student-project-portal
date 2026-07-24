import { sendError, sendSuccess } from '../../utils/apiResponse.util.js'
import * as service from './topicRounds.service.js'
const run = action => async (req, res) => {
  try { const result = await action(req); return result.success ? sendSuccess(res, result) : sendError(res, result) }
  catch (cause) { console.error(cause); return sendError(res, { statusCode: 500, message: 'Lỗi hệ thống.' }) }
}
export const lecturerList = run(req => service.lecturerList(req.user))
export const studentList = run(req => service.studentList(req.user))
export const create = run(req => service.create(req.body, req.user))
export const update = run(req => service.update(req.params.id, req.body, req.user))
export const status = run(req => service.status(req.params.id, req.body, req.user))

export const files = run(req => service.files(req.params.id, req.user))
export const uploadFile = run(req => service.uploadFile(req.params.id, req.file, req.user))
export const removeFile = run(req => service.removeFile(req.params.fileId, req.user))
export async function downloadFile(req,res){try{const result=await service.downloadFile(req.params.fileId,req.user);if(!result.success)return sendError(res,result);return res.download(result.data.absolutePath,result.data.originalName)}catch(cause){console.error(cause);return sendError(res,{statusCode:500,message:'Lỗi hệ thống.'})}}
export const register = run(req => service.register(req.params.id,req.body,req.user))
export const updateRegistration = run(req => service.updateRegistration(req.params.id,req.body,req.user))
