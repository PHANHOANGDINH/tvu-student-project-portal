import { useEffect, useState } from 'react'
import { Descriptions, Empty, Timeline } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { getStudentResult } from '../../api/gradingApi'
import { LoadingState, StatusBadge } from '../../components/common/UiState'
import { formatDateTimeVi, statusLabel } from '../../utils/formatters'

export default function SubmissionResultPage() {
  const { id } = useParams(), navigate = useNavigate()
  const [data, setData] = useState(null), [error, setError] = useState('')
  useEffect(() => { getStudentResult(id).then(response => setData(response.data)).catch(() => setError('Không tải được kết quả đánh giá. Vui lòng thử lại.')) }, [id])
  if (!data && !error) return <LoadingState />
  return <div><div className="page-title"><h2>Đánh giá bài nộp</h2><p>{data && `${data.groupName} · ${data.requirementTitle}`}</p></div>{error && <div className="alert error">{error}</div>}{data && <><div className="panel"><Descriptions bordered column={1} items={[{ key: 'status', label: 'Trạng thái', children: <StatusBadge status={data.status} /> }, { key: 'grade', label: 'Điểm', children: data.grade ? `${data.grade.totalScore}/${data.grade.maxScore}` : 'Chưa công bố' }, { key: 'feedback', label: 'Đánh giá', children: data.feedback?.comment || 'Giảng viên chưa phản hồi.' }, { key: 'revision', label: 'Yêu cầu chỉnh sửa', children: data.feedback?.revisionRequired ? data.feedback.revisionReason : 'Không' }]} />{data.grade?.scores?.map(score => <p key={score.criterionId}>{score.name}: {score.score}/{score.maxScore}{score.comment ? ` · ${score.comment}` : ''}</p>)}</div>{data.canResubmit && <button className="btn-primary" onClick={() => navigate(`/student/submission-requirements/${data.requirementId}/submit`)}>Nộp lại bài</button>}<div className="panel"><h3>Lịch sử đánh giá</h3>{data.history?.length ? <Timeline items={data.history.map(item => ({ children: `${formatDateTimeVi(item.createdAt)} · ${statusLabel(item.toStatus)}${item.comment ? ` · ${item.comment}` : ''}` }))} /> : <Empty description="Chưa có lịch sử đánh giá." />}</div></>}</div>
}
