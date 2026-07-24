import * as repo from './topicRounds.repository.js'
import * as requirementsRepo from '../submissions/submissionRequirements.repository.js'
import { notifyClass } from '../notifications/notifications.service.js'

const success = (data, message, statusCode = 200) => ({ success: true, data, message, statusCode })
const error = (statusCode, message, errors) => ({ success: false, statusCode, message, errors })
const clean = value => String(value ?? '').trim()
const id = value => Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : null
const payload = body => ({ classId: id(body.classId), name: clean(body.name), description: clean(body.description),
  startAt: new Date(body.startAt), endAt: new Date(body.endAt) })
function validate(data) {
  const errors = {}
  if (!data.classId) errors.classId = ['Vui lòng chọn lớp học phần.']
  if (!data.name) errors.name = ['Tên vòng đăng ký là bắt buộc.']
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
export const studentList = async user => success(await repo.listStudent(user.id), 'Lấy danh sách vòng đăng ký thành công.')
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
