import { useEffect, useState } from 'react'
import { Alert, Breadcrumb, Button, Card, Descriptions, Space, Typography } from 'antd'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getStudentRequirement } from '../../api/submissionRequirementsApi'
import { LoadingState, StatusBadge } from '../../components/common/UiState'
import { formatDateTimeVi } from '../../utils/formatters'
import './student-workflow.css'

const itemLabels = { REPORT: 'Báo cáo', SLIDE: 'Bài trình chiếu', SOURCE_CODE: 'Mã nguồn', OTHER: 'Tệp khác', GITHUB_LINK: 'Liên kết kho mã nguồn', VIDEO_LINK: 'Liên kết video' }

export default function RequirementDetailPage() {
  const { id } = useParams(), navigate = useNavigate()
  const [item, setItem] = useState(null), [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true), [error, setError] = useState('')
  useEffect(() => { getStudentRequirement(id).then(detail => { setItem(detail.data); setSubmission(detail.data?.submissionId ? { id: detail.data.submissionId } : null) }).catch(requestError => { if(requestError.status===403)setError('Bạn không có quyền xem yêu cầu này.');else if(requestError.status===404)setError('Không tìm thấy yêu cầu nộp bài.');else if(requestError.message==='Không thể kết nối đến máy chủ. Vui lòng thử lại.')setError(requestError.message);else setError('Hệ thống đang gặp sự cố. Vui lòng thử lại sau.') }).finally(() => setLoading(false)) }, [id])
  if (loading) return <LoadingState />
  if (error || !item) return <Alert type="error" showIcon message={error || 'Không tìm thấy yêu cầu nộp bài.'} action={<Button onClick={() => navigate('/student/submission-requirements')}>Quay lại danh sách</Button>} />
  const canSubmit = ['OPEN', 'OPEN_LATE'].includes(item.effectiveStatus) && Number(item.attemptsCount || 0) < Number(item.maxAttempts || 1) && (!submission || item.allowResubmission)
  const submissionPath = item.requirementType === 'ASSIGNMENT' ? `/student/final-submissions/${submission?.id}` : `/student/progress/${submission?.id}/submission`
  const required = (item.requiredItems || []).map(value => itemLabels[value.type] || itemLabels[value] || 'Nội dung khác').join(', ') || 'Không có'
  return <div className="student-workflow detail-page">
    <Breadcrumb items={[{ title: <Link to="/student/dashboard">Trang chủ</Link> }, { title: <Link to="/student/submission-requirements">Yêu cầu nộp bài</Link> }, { title: 'Chi tiết yêu cầu' }]} />
    <div className="page-title"><h2>{item.title}</h2><p>{item.classCode} — {item.className}</p><StatusBadge status={item.effectiveStatus} /></div>
    <Card title="Thông tin yêu cầu">
      <Typography.Title level={5}>Mô tả</Typography.Title><Typography.Paragraph>{item.description || 'Không có mô tả.'}</Typography.Paragraph>
      <Typography.Title level={5}>Hướng dẫn</Typography.Title><Typography.Paragraph>{item.instructions || 'Không có hướng dẫn bổ sung.'}</Typography.Paragraph>
      <Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }} items={[
        { key: 'start', label: 'Thời gian bắt đầu', children: formatDateTimeVi(item.startAt) },
        { key: 'deadline', label: 'Hạn nộp', children: formatDateTimeVi(item.deadline) },
        { key: 'attempts', label: 'Số lần nộp tối đa', children: `${item.maxAttempts} lần` },
        { key: 'late', label: 'Cho phép nộp trễ', children: item.allowLate ? 'Có' : 'Không' },
        { key: 'resubmit', label: 'Cho phép nộp lại', children: item.allowResubmission ? 'Có' : 'Không' },
        { key: 'required', label: 'Nội dung bắt buộc', children: required },
        { key: 'status', label: 'Trạng thái', children: <StatusBadge status={item.effectiveStatus} /> }
      ]} />
      <Space wrap className="detail-actions"><Button onClick={() => navigate('/student/submission-requirements')}>Quay lại danh sách</Button>{submission && <Button onClick={() => navigate(submissionPath)}>Xem bài đã nộp</Button>}{canSubmit && <Button type="primary" onClick={() => navigate(`/student/submission-requirements/${id}/submit`)}>{submission ? 'Nộp lại' : 'Nộp bài'}</Button>}</Space>
    </Card>
  </div>
}
