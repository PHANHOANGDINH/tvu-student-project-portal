import { useEffect, useState } from 'react'
import { Alert, Breadcrumb, Button, Card, Descriptions, Empty, Space, Typography } from 'antd'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { currentSubmission, studentSubmissionWorkflow } from '../../api/submissionsApi'
import { LoadingState, StatusBadge } from '../../components/common/UiState'
import { formatDateTimeVi } from '../../utils/formatters'
import './student-workflow.css'

function canSubmit(item) {
  if (!item || item.requirementStatus !== 'OPEN' || !item.groupId) return false
  const attemptsRemain = Number(item.attemptNumber || 0) < Number(item.maxAttempts || 1)
  return Date.now() >= new Date(item.startAt).getTime() && (Date.now() <= new Date(item.dueAt).getTime() || item.allowLate) && attemptsRemain && (!item.attemptNumber || item.allowResubmission)
}

export default function ProgressDetailPage() {
  const { id } = useParams(), navigate = useNavigate()
  const [item, setItem] = useState(null), [submission, setSubmission] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState('')
  useEffect(() => { studentSubmissionWorkflow('PROGRESS').then(response => { const found = (response.data || []).find(value => String(value.requirementId) === String(id)); if (!found) throw new Error('not found'); setItem(found); return currentSubmission(id) }).then(response => setSubmission(response.data?.submission || null)).catch(() => setError('Không tải được báo cáo tiến độ hoặc bạn không có quyền xem báo cáo này.')).finally(() => setLoading(false)) }, [id])
  if (loading) return <LoadingState />
  if (error || !item) return <Alert type="error" showIcon message={error || 'Không tìm thấy báo cáo tiến độ.'} action={<Button onClick={() => navigate('/student/progress')}>Quay lại</Button>} />
  const status = item.submissionStatus || 'NOT_SUBMITTED'
  return <div className="student-workflow detail-page"><Breadcrumb items={[{ title: <Link to="/student/dashboard">Trang chủ</Link> }, { title: <Link to="/student/progress">Báo cáo tiến độ</Link> }, { title: 'Chi tiết' }]} /><div className="page-title"><h2>Báo cáo tiến độ</h2><p>{item.title}</p></div><Card title={item.title} extra={<StatusBadge status={status} />}><Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }} items={[{ key: 'class', label: 'Lớp học phần', children: `${item.courseClassCode} — ${item.courseName}` }, { key: 'group', label: 'Nhóm', children: item.groupName || 'Chưa tham gia nhóm' }, { key: 'topic', label: 'Đề tài', children: item.topicTitle || 'Chưa có đề tài' }, { key: 'deadline', label: 'Hạn nộp', children: formatDateTimeVi(item.dueAt) }, { key: 'attempt', label: 'Lần nộp gần nhất', children: item.attemptNumber ? `#${item.attemptNumber}` : 'Chưa nộp' }, { key: 'submitted', label: 'Nộp lúc', children: formatDateTimeVi(item.submittedAt) }, { key: 'score', label: 'Điểm', children: item.score == null ? 'Chưa có kết quả đánh giá' : `${item.score} / ${item.maxScore || 10}` }]} /><Typography.Paragraph className="detail-summary">{item.description || 'Không có mô tả bổ sung.'}</Typography.Paragraph><Space wrap className="detail-actions"><Button onClick={() => navigate('/student/progress')}>Quay lại</Button>{submission ? <Button onClick={() => navigate(`/student/progress/${submission.id}/submission`)}>Xem bài đã nộp</Button> : <Button disabled>Chưa có bài nộp</Button>}<Button disabled={!submission || (!item.feedback && item.score == null)} onClick={() => navigate(`/student/progress/${submission.id}/evaluation`)}>Xem đánh giá</Button>{canSubmit(item) && <Button type="primary" onClick={() => navigate(`/student/submission-requirements/${id}/submit`)}>{submission ? 'Nộp lại' : 'Nộp báo cáo'}</Button>}</Space></Card>{!submission && <Empty description="Báo cáo này chưa có lần nộp." />}</div>
}
