import { normalizeRole, USER_ROLES } from './roles'

export const ROLE_LABELS = Object.freeze({
  [USER_ROLES.ADMIN]: 'Quản trị viên',
  [USER_ROLES.LECTURER]: 'Giảng viên',
  [USER_ROLES.STUDENT]: 'Sinh viên'
})

export const STATUS_LABELS = Object.freeze({
  ACTIVE: 'Hoạt động', INACTIVE: 'Ngừng hoạt động', LOCKED: 'Đã khóa', PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt', REJECTED: 'Từ chối', REQUIRES_REVISION: 'Cần chỉnh sửa',
  COMPLETED: 'Đã hoàn thành', COMPLETE: 'Đã hoàn thành', DONE: 'Đã hoàn thành', CANCELLED: 'Đã hủy',
  DRAFT: 'Bản nháp', OPEN: 'Đang mở', CLOSED: 'Đã đóng', SUBMITTED: 'Đã nộp',
  RESUBMITTED: 'Đã nộp lại', LATE: 'Nộp trễ', UNDER_REVIEW: 'Chờ đánh giá', REVIEWED: 'Đã đánh giá',
  NOT_SUBMITTED: 'Chưa nộp', PUBLISHED: 'Đã công bố', GRADED: 'Đã chấm'
})

export const STATUS_COLORS = Object.freeze({ ACTIVE: 'green', APPROVED: 'green', COMPLETED: 'green', GRADED: 'green', PENDING: 'gold', OPEN: 'blue', UNDER_REVIEW: 'blue', REJECTED: 'red', LOCKED: 'red', LATE: 'red', REQUIRES_REVISION: 'orange' })
export const getRoleLabel = role => ROLE_LABELS[normalizeRole(role)] || String(role || '—')
export const getStatusLabel = status => STATUS_LABELS[String(status || '').toUpperCase()] || String(status || '—')
