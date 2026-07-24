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
