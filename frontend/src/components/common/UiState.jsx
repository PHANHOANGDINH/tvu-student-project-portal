import { AlertCircle, Inbox, LoaderCircle, RefreshCw } from 'lucide-react'
import { STATUS_LABELS } from '../../utils/formatters'

export function LoadingState({ label = 'Đang tải dữ liệu...' }) {
  return <div className="ui-state" aria-live="polite"><LoaderCircle className="spin-icon" /><strong>{label}</strong><span>Vui lòng chờ trong giây lát.</span></div>
}

export function EmptyState({ title = 'Chưa có dữ liệu', description = 'Dữ liệu sẽ xuất hiện tại đây khi có thông tin.', action }) {
  return <div className="ui-state"><Inbox /><strong>{title}</strong><span>{description}</span>{action}</div>
}

export function ErrorState({ message = 'Đã xảy ra lỗi. Vui lòng thử lại.', onRetry }) {
  return <div className="ui-state error-state" role="alert"><AlertCircle /><strong>Không thể tải dữ liệu</strong><span>{message}</span>{onRetry && <button className="btn-light" onClick={onRetry}><RefreshCw size={16} /> Tải lại</button>}</div>
}

const statusMap = {
  ACTIVE: ['Đang hoạt động', 'green'], INACTIVE: ['Ngừng hoạt động', 'muted'], APPROVED: ['Đã duyệt', 'green'], PENDING: ['Chờ duyệt', 'warning'], REJECTED: ['Từ chối', 'red'], REQUIRES_REVISION: ['Cần chỉnh sửa', 'warning'], CANCELLED: ['Đã hủy', 'muted'], SUBMITTED: ['Đã nộp', 'blue'], RESUBMITTED: ['Đã nộp lại', 'blue'], LATE: ['Nộp trễ', 'red'], REVIEWED: ['Đã nhận xét', 'green'], GRADED: ['Đã chấm', 'green'], DRAFT: ['Bản nháp', 'muted'], OPEN: ['Đang mở', 'green'], CLOSED: ['Đã đóng', 'muted'], NOT_SUBMITTED: ['Chưa nộp', 'muted'], COMPLETED: ['Hoàn thành', 'green'], FAILED: ['Chưa đạt', 'red'], UNDER_REVIEW: ['Đang xem xét', 'warning']
}
export function StatusBadge({ status, children }) {
  const value = String(status || '')
  const upper = value.toUpperCase()
  const [, tone] = statusMap[upper] || ['', 'muted']
  const label = STATUS_LABELS[upper] || children || 'Chưa xác định'
  return <span className={`status-badge-ui ${tone}`}>{children || label}</span>
}
