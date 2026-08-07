import { useEffect, useState } from 'react'
import { Alert, Breadcrumb, Button, Card, Descriptions, Space, Typography } from 'antd'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getStudentResult } from '../../api/gradingApi'
import { studentSubmission } from '../../api/submissionsApi'
import { LoadingState, StatusBadge } from '../../components/common/UiState'
import { formatDateTimeVi } from '../../utils/formatters'
import './student-workflow.css'

export default function WorkflowEvaluationPage({ type = 'progress' }) {
  const { id } = useParams(), navigate = useNavigate(), back = type === 'final' ? '/student/final-submissions' : '/student/progress'
  const [submission, setSubmission] = useState(null), [result, setResult] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState('')
  useEffect(() => { Promise.all([studentSubmission(id), getStudentResult(id)]).then(([detail, evaluation]) => { setSubmission(detail.data); setResult(evaluation.data) }).catch(() => setError('Không tải được đánh giá. Vui lòng thử lại.')).finally(() => setLoading(false)) }, [id])
  if (loading) return <LoadingState />
  if (error || !submission) return <Alert type="error" showIcon message={error || 'Không tìm thấy đánh giá.'} action={<Button onClick={() => navigate(back)}>Quay lại</Button>} />
  const info = submission.submission || submission, latest = submission.attempts?.[0]
  return <div className="student-workflow detail-page"><Breadcrumb items={[{ title: <Link to={back}>{type === 'final' ? 'Bài cuối kỳ và điểm' : 'Báo cáo tiến độ'}</Link> }, { title: 'Đánh giá' }]} /><div className="page-title"><h2>{type === 'final' ? 'Đánh giá bài cuối kỳ' : 'Đánh giá tiến độ'}</h2><p>{info.requirementTitle}</p></div>
    <Card><Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }} items={[{ key: 'class', label: 'Lớp học phần', children: info.classCode }, { key: 'requirement', label: 'Yêu cầu', children: info.requirementTitle }, { key: 'group', label: 'Nhóm', children: info.groupName }, { key: 'attempt', label: 'Lần nộp', children: latest ? `#${latest.attemptNumber}` : 'Chưa nộp' }, { key: 'submitted', label: 'Nộp lúc', children: formatDateTimeVi(latest?.submittedAt) }, { key: 'status', label: 'Trạng thái', children: <StatusBadge status={info.status} /> }, { key: 'score', label: 'Điểm', children: result?.grade?.isPublished ? `${result.grade.totalScore} / ${result.grade.maxScore}` : 'Chưa có kết quả đánh giá' }]} /></Card>
    <Card title="Giảng viên đánh giá"><Typography.Title level={5}>Nhận xét</Typography.Title><Typography.Paragraph>{result?.feedback?.comment || 'Giảng viên chưa có nhận xét.'}</Typography.Paragraph><Typography.Title level={5}>Yêu cầu bổ sung</Typography.Title><Typography.Paragraph>{result?.feedback?.revisionRequired ? result.feedback.revisionReason : 'Không có yêu cầu bổ sung.'}</Typography.Paragraph><Descriptions column={{ xs: 1, sm: 2 }} items={[{ key: 'date', label: 'Ngày đánh giá', children: formatDateTimeVi(result?.feedback?.updatedAt || result?.grade?.gradedAt) }, { key: 'lecturer', label: 'Giảng viên', children: result?.feedback?.evaluatorName || 'Giảng viên phụ trách' }]} /></Card>
    <Space wrap className="detail-actions"><Button onClick={() => navigate(back)}>Quay lại {type === 'final' ? 'bài cuối kỳ' : 'báo cáo tiến độ'}</Button><Button onClick={() => navigate(`${back}/${id}`)}>Xem bài đã nộp</Button></Space>
  </div>
}
