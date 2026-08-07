import { useEffect, useState } from 'react'
import { Alert, Breadcrumb, Button, Card, Descriptions, Space, Typography } from 'antd'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getStudentRequirement } from '../../api/submissionRequirementsApi'
import { currentSubmission } from '../../api/submissionsApi'
import { LoadingState, StatusBadge } from '../../components/common/UiState'
import { formatDateTimeVi } from '../../utils/formatters'
import './student-workflow.css'

const itemLabels = { REPORT: 'Báo cáo', SLIDE: 'Bài trình chiếu', SOURCE_CODE: 'Mã nguồn', OTHER: 'Tệp khác', GITHUB_LINK: 'Liên kết kho mã nguồn', VIDEO_LINK: 'Liên kết video' }

export default function RequirementDetailPage() {
  const { id } = useParams(), navigate = useNavigate()
  const [item, setItem] = useState(null), [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true), [error, setError] = useState('')
  useEffect(() => { Promise.all([getStudentRequirement(id), currentSubmission(id)]).then(([detail, current]) => { setItem(detail.data); setSubmission(current.data?.submission || null) }).catch(() => setError('Không tải được chi tiết yêu cầu. Vui lòng thử lại.')).finally(() => setLoading(false)) }, [id])
  if (loading) return <LoadingState />
  if (error || !item) return <Alert type="error" showIcon message={error || 'Không tìm thấy yêu cầu nộp bài.'} action={<Button onClick={() => navigate('/student/submission-requirements')}>Quay lại</Button>} />
  const canSubmit = ['OPEN', 'OPEN_LATE'].includes(item.effectiveStatus)
  const required = (item.requiredItems || []).map(value => itemLabels[value.type] || itemLabels[value] || 'Nội dung khác').join(', ') || 'Không có'
  return <div className="student-workflow detail-page">
    <Breadcrumb items={[{ title: <Link to="/student/submission-requirements">Yêu cầu nộp bài</Link> }, { title: 'Chi tiết yêu cầu' }]} />
    <div className="page-title"><h2>{item.title}</h2><p>{item.classCode} · {item.className}</p><StatusBadge status={item.effectiveStatus} /></div>
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
      <Space wrap className="detail-actions"><Button onClick={() => navigate('/student/submission-requirements')}>Quay lại</Button>{submission && <Button onClick={() => navigate(`/student/progress/${submission.id}/submission`)}>Xem bài đã nộp</Button>}{canSubmit && <Button type="primary" onClick={() => navigate(`/student/submission-requirements/${id}/submit`)}>{submission ? 'Nộp lại' : 'Nộp bài'}</Button>}</Space>
    </Card>
  </div>
}
