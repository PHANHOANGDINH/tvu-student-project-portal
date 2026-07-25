import * as repo from './topicRounds.repository.js'
import * as requirementsRepo from '../submissions/submissionRequirements.repository.js'
import { notifyClass } from '../notifications/notifications.service.js'
import { cleanupFiles, relativeUploadPath, resolveStoredFile } from '../../services/fileStorage.service.js'
import { unlink } from 'fs/promises'

const success = (data, message, statusCode = 200) => ({ success: true, data, message, statusCode })
const error = (statusCode, message, errors) => ({ success: false, statusCode, message, errors })
const clean = value => String(value ?? '').trim()
const id = value => Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : null
const payload = body => ({
  classId: id(body.classId),
  name: clean(body.name),
  description: clean(body.description),
  requirements: clean(body.requirements),
  allowEditing: body.allowEditing !== false,
  maxEditCount: Number(body.maxEditCount),
  startAt: new Date(body.startAt),
  endAt: new Date(body.endAt),
})
function validate(data) {
  const errors = {}
  if (!data.classId) errors.classId = ['Vui lòng chọn lớp học phần.']
  if (!data.name) errors.name = ['Tên vòng đăng ký là bắt buộc.']
  if (!Number.isInteger(data.maxEditCount) || data.maxEditCount < 0 || data.maxEditCount > 20)
    errors.maxEditCount = ['Số lần chỉnh sửa tối đa phải từ 0 đến 20.']
  if (Number.isNaN(data.startAt.getTime()) || Number.isNaN(data.endAt.getTime()) || data.startAt >= data.endAt)
    errors.time = ['Thời gian bắt đầu phải trước thời gian kết thúc.']
  return errors
}
async function owned(roundId, user) {
  const round = await repo.find(id(roundId))
  if (!round) return { failure: error(404, 'Không tìm thấy vòng đăng ký đề tài.') }
  return round.lecturerId === user.id ? { round } : { failure: error(403, 'Bạn không phụ trách lớp học phần này.') }
}
export const lecturerList = async user => success(await repo.listLecturer(user.id), 'Lấy danh sách vòng đăng ký thành công.')
export const studentList = async user => { const rows=await repo.listStudent(user.id); return success(await Promise.all(rows.map(async round=>{const context=await repo.studentContext(round.id,user.id);const registration=context?.groupId?await repo.registration(round.id,context.groupId):null;return{...round,registration,isLeader:context?.leaderId===user.id,groupId:context?.groupId||null}})),'Lấy danh sách vòng đăng ký thành công.') }
export async function create(body, user) {
  const data = payload(body), errors = validate(data)
  if (Object.keys(errors).length) return error(400, 'Dữ liệu không hợp lệ.', errors)
  const courseClass = await requirementsRepo.findClass(data.classId)
  if (!courseClass) return error(404, 'Không tìm thấy lớp học phần.')
  if (courseClass.lecturerId !== user.id) return error(403, 'Bạn không phụ trách lớp học phần này.')
  return success(await repo.create(data, user.id), 'Tạo vòng đăng ký đề tài thành công.', 201)
}
export async function update(roundId, body, user) {
  const ownedRound = await owned(roundId, user)
  if (ownedRound.failure) return ownedRound.failure
  if (!['DRAFT', 'CANCELLED'].includes(ownedRound.round.status)) return error(409, 'Chỉ có thể sửa vòng đăng ký chưa mở.')
  const data = payload({ ...body, classId: ownedRound.round.classId }), errors = validate(data)
  return Object.keys(errors).length ? error(400, 'Dữ liệu không hợp lệ.', errors)
    : success(await repo.update(ownedRound.round.id, data), 'Cập nhật vòng đăng ký thành công.')
}
export async function status(roundId, body, user) {
  const ownedRound = await owned(roundId, user)
  if (ownedRound.failure) return ownedRound.failure
  const next = clean(body.status).toUpperCase()
  if (!['DRAFT', 'OPEN', 'CLOSED', 'CANCELLED'].includes(next)) return error(400, 'Trạng thái không hợp lệ.')
  const updated = await repo.setStatus(ownedRound.round.id, next)
  if (next === 'OPEN') await notifyClass(updated.classId, { type: 'TOPIC_ROUND_OPENED',
    title: 'Đã mở vòng đăng ký đề tài', message: updated.name, relatedEntityType: 'TOPIC_ROUND',
    relatedEntityId: updated.id, eventKey: `TOPIC_ROUND_OPENED:${updated.id}` })
  return success(updated, 'Cập nhật trạng thái vòng đăng ký thành công.')
}

export async function files(roundId,user){const round=await repo.find(id(roundId));if(!round)return error(404,'Không tìm thấy vòng đăng ký.');const allowed=user.role==='LECTURER'?round.lecturerId===user.id:await repo.studentCanAccess(round.id,user.id);return allowed?success(await repo.listFiles(round.id),'Lấy danh sách file thành công.'):error(403,'Bạn không có quyền truy cập vòng đăng ký này.')}
export async function uploadFile(roundId,file,user){const access=await owned(roundId,user);if(access.failure){await cleanupFiles(file?[file]:[]);return access.failure}if(access.round.status!=='DRAFT'){await cleanupFiles(file?[file]:[]);return error(409,'Chỉ được tải file lên khi vòng đăng ký còn ở trạng thái nháp.')}if(!file)return error(400,'Vui lòng chọn file.');try{return success(await repo.addFile(access.round.id,{...file,relativePath:relativeUploadPath(file.filename)},user.id),'Tải file hướng dẫn thành công.',201)}catch(cause){await cleanupFiles([file]);throw cause}}
export async function downloadFile(fileId,user){const file=await repo.findFile(id(fileId));if(!file)return error(404,'Không tìm thấy file.');const allowed=user.role==='LECTURER'?file.lecturerId===user.id:await repo.studentCanAccess(file.roundId,user.id);return allowed?success({...file,absolutePath:resolveStoredFile(file.relativePath)},'Tải file thành công.'):error(403,'Bạn không có quyền tải file này.')}
export async function removeFile(fileId,user){const file=await repo.findFile(id(fileId));if(!file)return error(404,'Không tìm thấy file.');if(file.lecturerId!==user.id)return error(403,'Bạn không có quyền xóa file này.');if(file.status!=='DRAFT'||file.registrationCount>0)return error(409,'Không thể xóa file sau khi vòng đã mở hoặc đã có đăng ký.');await repo.deleteFile(file.id);await unlink(resolveStoredFile(file.relativePath)).catch(()=>null);return success(null,'Xóa file thành công.')}
function topicPayload(body){return{title:clean(body.title),description:clean(body.description),objectives:clean(body.objectives),scope:clean(body.scope),technologies:clean(body.technologies),expectedResults:clean(body.expectedResults),referenceUrl:clean(body.referenceUrl)}}
function validUrl(value){if(!value)return true;if(value.length>1000)return false;try{return['http:','https:'].includes(new URL(value).protocol)}catch{return false}}
async function registrationContext(roundId,user){const context=await repo.studentContext(id(roundId),user.id);if(!context)return{failure:error(404,'Không tìm thấy vòng đăng ký trong lớp của bạn.')};if(!context.groupId)return{failure:error(409,'Bạn chưa thuộc nhóm trong lớp học phần này.')};if(context.leaderId!==user.id)return{failure:error(403,'Chỉ trưởng nhóm được gửi hoặc chỉnh sửa đề tài.')};const now=Date.now();if(context.status!=='OPEN'||now<new Date(context.startAt).getTime()||now>new Date(context.endAt).getTime())return{failure:error(409,now<new Date(context.startAt).getTime()?'Chưa đến thời gian đăng ký.':'Đợt đăng ký đã kết thúc.')};return{context}}
export async function register(roundId,body,user){const access=await registrationContext(roundId,user);if(access.failure)return access.failure;const data=topicPayload(body);if(!data.title||!data.description)return error(400,'Tên và mô tả đề tài là bắt buộc.');if(!validUrl(data.referenceUrl))return error(400,'Link tham khảo phải là URL HTTP hoặc HTTPS hợp lệ.');if(await repo.registration(access.context.roundId,access.context.groupId))return error(409,'Nhóm đã đăng ký đề tài trong vòng này.');try{return success(await repo.createRegistration(access.context,data),'Đăng ký đề tài thành công.',201)}catch(cause){if([2601,2627].includes(cause.number))return error(409,'Nhóm đã đăng ký đề tài trong vòng này.');throw cause}}
export async function updateRegistration(roundId,body,user){const access=await registrationContext(roundId,user);if(access.failure)return access.failure;const current=await repo.registration(access.context.roundId,access.context.groupId);if(!current)return error(404,'Nhóm chưa đăng ký đề tài trong vòng này.');if(current.status==='APPROVED')return error(409,'Đề tài đã duyệt không thể chỉnh sửa.');if(!access.context.allowEditing||current.revisionCount>=access.context.maxEditCount)return error(409,'Đã hết quyền hoặc số lần chỉnh sửa đề tài.');const data=topicPayload(body);if(!data.title||!data.description||!validUrl(data.referenceUrl))return error(400,'Dữ liệu đề tài không hợp lệ.');return success(await repo.updateRegistration(current,data),'Cập nhật đề tài thành công.')}