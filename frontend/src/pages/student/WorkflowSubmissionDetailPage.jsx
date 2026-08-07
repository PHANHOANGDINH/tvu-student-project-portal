import { useEffect, useState } from 'react'
import { Alert, Breadcrumb, Button, Card, Descriptions, Empty, List, Space, Timeline, Typography } from 'antd'
import { DownloadOutlined, LinkOutlined } from '@ant-design/icons'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getStudentResult } from '../../api/gradingApi'
import { downloadSubmissionFile, studentSubmission } from '../../api/submissionsApi'
import { LoadingState, StatusBadge } from '../../components/common/UiState'
import { formatDateTimeVi, statusLabel } from '../../utils/formatters'
import './student-workflow.css'

export default function WorkflowSubmissionDetailPage({ type = 'progress' }) {
  const { id } = useParams(), navigate = useNavigate(), back = type === 'final' ? '/student/final-submissions' : '/student/progress'
  const [detail, setDetail] = useState(null), [result, setResult] = useState(null), [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true), [error, setError] = useState('')
  useEffect(() => { Promise.all([studentSubmission(id), getStudentResult(id)]).then(([submission, evaluation]) => { setDetail(submission.data); setResult(evaluation.data); setSelected(submission.data?.attempts?.[0] || null) }).catch(() => setError('Không tải được chi tiết bài nộp. Vui lòng thử lại.')).finally(() => setLoading(false)) }, [id])
  async function download(file) { const blob = await downloadSubmissionFile(file.id, 'student'); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = file.originalName; anchor.click(); URL.revokeObjectURL(url) }
  if (loading) return <LoadingState />
  if (error || !detail) return <Alert type="error" showIcon message={error || 'Không tìm thấy bài nộp.'} action={<Button onClick={() => navigate(back)}>Quay lại</Button>} />
  const submission = detail.submission || detail, attempts = detail.attempts || []
  return <div className="student-workflow detail-page"><Breadcrumb items={[{ title: <Link to={back}>{type === 'final' ? 'Bài cuối kỳ và điểm' : 'Báo cáo tiến độ'}</Link> }, { title: 'Chi tiết bài đã nộp' }]} /><div className="page-title"><h2>{submission.requirementTitle}</h2><p>{submission.classCode} · {submission.groupName}</p></div>
    <Card title="Thông tin bài nộp"><Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }} items={[{ key: 'class', label: 'Lớp học phần', children: submission.classCode }, { key: 'requirement', label: 'Yêu cầu', children: submission.requirementTitle }, { key: 'group', label: 'Nhóm', children: submission.groupName }, { key: 'attempt', label: 'Lần nộp gần nhất', children: submission.latestAttemptNumber ? `#${submission.latestAttemptNumber}` : 'Chưa nộp' }, { key: 'submitted', label: 'Nộp lúc', children: formatDateTimeVi(attempts[0]?.submittedAt) }, { key: 'status', label: 'Trạng thái', children: <StatusBadge status={submission.status} /> }]} /></Card>
    <Card title="Lịch sử các lần nộp"><Timeline items={attempts.map(attempt => ({ color: selected?.id === attempt.id ? 'blue' : 'gray', children: <Button type="link" onClick={() => setSelected(attempt)}>Lần nộp #{attempt.attemptNumber} · {statusLabel(attempt.status)} · {formatDateTimeVi(attempt.submittedAt)}</Button> }))} />{!selected ? <Empty description="Chưa có lần nộp." /> : <div className="attempt-detail"><Typography.Title level={5}>Lần nộp #{selected.attemptNumber}</Typography.Title><Typography.Paragraph>{selected.description || 'Không có mô tả bổ sung.'}</Typography.Paragraph><List header={<strong>Tệp đính kèm</strong>} locale={{ emptyText: 'Không có tệp đính kèm.' }} dataSource={selected.files || []} renderItem={file => <List.Item actions={[<Button key="download" type="link" icon={<DownloadOutlined />} onClick={() => download(file)}>Tải xuống</Button>]}>{file.originalName}</List.Item>} /><List header={<strong>Liên kết</strong>} locale={{ emptyText: 'Không có liên kết.' }} dataSource={selected.links || []} renderItem={item => <List.Item><a href={item.url} target="_blank" rel="noreferrer"><LinkOutlined /> {item.url}</a></List.Item>} /></div>}</Card>
    {(result?.feedback || result?.grade) && <Card title="Phản hồi của giảng viên"><Typography.Paragraph>{result.feedback?.comment || 'Chưa có nhận xét.'}</Typography.Paragraph>{result.feedback?.revisionRequired && <Alert type="warning" showIcon message="Yêu cầu chỉnh sửa" description={result.feedback.revisionReason} />}<p><strong>Điểm:</strong> {result.grade?.isPublished ? `${result.grade.totalScore} / ${result.grade.maxScore}` : 'Chưa có kết quả đánh giá'}</p></Card>}
    <Space wrap className="detail-actions"><Button onClick={() => navigate(back)}>Quay lại</Button>{(result?.feedback || result?.grade) && <Button type="primary" onClick={() => navigate(`${back}/${id}/evaluation`)}>Xem đánh giá</Button>}</Space>
  </div>
}
