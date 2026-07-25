const STATUS_LABELS = {
  DRAFT: "Bản nháp",
  OPEN: "Đang mở",
  SCHEDULED: "Sắp mở",
  OPEN_LATE: "Đang nhận bài trễ",
  EXPIRED: "Đã hết hạn",
  CLOSED: "Đã đóng",
  CANCELLED: "Đã hủy",
  PENDING: "Chờ duyệt",
  SUBMITTED: "Đã nộp",
  RESUBMITTED: "Đã nộp lại",
  LATE: "Nộp trễ",
  UNDER_REVIEW: "Đang xem xét",
  REQUIRES_REVISION: "Cần chỉnh sửa",
  REVISION_REQUIRED: "Cần chỉnh sửa",
  APPROVED: "Đã duyệt",
  COMPLETED: "Hoàn thành",
  ACCEPTED: "Đã xác nhận",
  REJECTED: "Bị từ chối",
  NOT_ACCEPTED: "Chưa đạt",
  NOT_MET: "Chưa đạt",
  GRADED: "Đã chấm điểm",
};
const STATUS_VARIANTS = {
  DRAFT: "draft",
  OPEN: "open",
  SCHEDULED: "pending",
  OPEN_LATE: "warning",
  EXPIRED: "closed",
  CLOSED: "closed",
  CANCELLED: "cancelled",
  PENDING: "pending",
  SUBMITTED: "submitted",
  RESUBMITTED: "submitted",
  LATE: "late",
  UNDER_REVIEW: "pending",
  REQUIRES_REVISION: "warning",
  REVISION_REQUIRED: "warning",
  APPROVED: "approved",
  COMPLETED: "approved",
  ACCEPTED: "approved",
  REJECTED: "rejected",
  NOT_ACCEPTED: "rejected",
  NOT_MET: "rejected",
  GRADED: "approved",
};
export function getStatusLabel(status) {
  if (!status) return "Chưa xác định";
  return STATUS_LABELS[status] || "Ch?a x?c ??nh";
}
export function getStatusBadgeVariant(status) {
  return STATUS_VARIANTS[status] || "neutral";
}
export const WORKFLOW_STATUSES = STATUS_LABELS;
