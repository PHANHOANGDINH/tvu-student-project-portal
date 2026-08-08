export const STATUS_LABELS = Object.freeze({
  ACTIVE: 'Đang hoạt động', INACTIVE: 'Ngừng hoạt động', LOCKED: 'Đã khóa',
  OPEN: 'Đang mở', OPEN_LATE: 'Đang nhận bài trễ', CLOSED: 'Đã đóng', SCHEDULED: 'Sắp mở', EXPIRED: 'Đã hết hạn',
  PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối', CANCELLED: 'Đã hủy',
  NOT_SUBMITTED: 'Chưa nộp', SUBMITTED: 'Đã nộp', RESUBMITTED: 'Đã nộp lại', LATE: 'Nộp trễ',
  UNDER_REVIEW: 'Chờ đánh giá', REVIEWED: 'Đã đánh giá', REQUIRES_REVISION: 'Cần chỉnh sửa', NEEDS_REVISION: 'Cần chỉnh sửa',
  GRADED: 'Đã chấm điểm', COMPLETED: 'Hoàn thành', DRAFT: 'Bản nháp', FAILED: 'Chưa đạt'
})

export const ROLE_LABELS = Object.freeze({ ADMIN: 'Quản trị viên', LECTURER: 'Giảng viên', STUDENT: 'Sinh viên' })

export function statusLabel(status) {
  return STATUS_LABELS[String(status || '').toUpperCase()] || 'Chưa xác định'
}

const TOPIC_STATUS_LABELS = Object.freeze({ PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối', CANCELLED: 'Đã hủy', REQUIRES_REVISION: 'Cần chỉnh sửa' })
const REQUIREMENT_STATUS_LABELS = Object.freeze({ DRAFT: 'Bản nháp', OPEN: 'Đang mở', OPEN_LATE: 'Đang nhận bài trễ', CLOSED: 'Đã đóng', SCHEDULED: 'Sắp mở', EXPIRED: 'Đã hết hạn', CANCELLED: 'Đã hủy' })
const SUBMISSION_STATUS_LABELS = Object.freeze({ PENDING: 'Chờ xử lý', NOT_SUBMITTED: 'Chưa nộp', SUBMITTED: 'Đã nộp', RESUBMITTED: 'Đã nộp lại', LATE: 'Nộp trễ', UNDER_REVIEW: 'Chờ đánh giá', REVIEWED: 'Đã đánh giá', REQUIRES_REVISION: 'Cần chỉnh sửa', GRADED: 'Đã chấm điểm', COMPLETED: 'Hoàn thành', PUBLISHED: 'Đã công bố', DRAFT: 'Bản nháp' })
const ACCOUNT_STATUS_LABELS = Object.freeze({ ACTIVE: 'Đang hoạt động', INACTIVE: 'Ngừng hoạt động', LOCKED: 'Đã khóa' })
const domainLabel = (labels, value) => labels[String(value || '').toUpperCase()] || 'Chưa xác định'
export const topicStatusLabel = value => domainLabel(TOPIC_STATUS_LABELS, value)
export const submissionRequirementStatusLabel = value => domainLabel(REQUIREMENT_STATUS_LABELS, value)
export const submissionStatusLabel = value => domainLabel(SUBMISSION_STATUS_LABELS, value)
export const progressStatusLabel = submissionStatusLabel
export const gradeStatusLabel = value => domainLabel({ PENDING: 'Chưa công bố', PUBLISHED: 'Đã công bố', GRADED: 'Đã chấm điểm' }, value)
export const accountStatusLabel = value => domainLabel(ACCOUNT_STATUS_LABELS, value)
export const formatGroupName = value => { const name=String(value||'').trim(); return name ? (/^nhóm\s/i.test(name) ? name : `Nhóm ${name}`) : 'Chưa có nhóm' }

export function formatDateTimeVi(value, fallback = '—') {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
}
