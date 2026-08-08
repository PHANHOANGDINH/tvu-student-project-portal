import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Checkbox, Input, InputNumber, List, Space } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { useParams } from 'react-router-dom'
import { changeReviewStatus, getReview, saveFeedback, saveGrade } from '../../api/gradingApi'
import { downloadSubmissionFile } from '../../api/submissionsApi'
import { StatusBadge } from '../../components/common/UiState'
import { formatDateTimeVi, statusLabel } from '../../utils/formatters'

export default function SubmissionReviewPage() {
  const { id } = useParams()
  const [data, setData] = useState(null), [comment, setComment] = useState(''), [revision, setRevision] = useState(false), [reason, setReason] = useState(''), [scores, setScores] = useState({}), [total, setTotal] = useState(''), [loading, setLoading] = useState(true), [error, setError] = useState('')
  const load = () => getReview(id).then(response => { const value = response.data; setData(value); setComment(value.feedback?.comment || ''); setRevision(Boolean(value.feedback?.revisionRequired)); setReason(value.feedback?.revisionReason || ''); setTotal(value.grade?.usesCriteria ? '' : value.grade?.totalScore ?? ''); setScores(Object.fromEntries((value.grade?.scores || []).map(item => [item.criterionId, item.score]))) }).catch(requestError => setError(requestError.message)).finally(() => setLoading(false))
  useEffect(load, [id])
  const sum = useMemo(() => Object.values(scores).reduce((value, score) => value + (Number(score) || 0), 0), [scores])
  const act = async action => { try { setError(''); await action(); await load() } catch (requestError) { setError(requestError.message) } }
  const grade = publish => { const criteria = data.criteria || []; const body = criteria.length ? { scores: criteria.map(item => ({ criterionId: item.id, score: Number(scores[item.id] || 0) })), isPublished: publish } : { totalScore: Number(total), isPublished: publish }; if (publish && !window.confirm('Công bố kết quả cho sinh viên?')) return; act(() => saveGrade(id, body)) }
  async function download(file) { const blob = await downloadSubmissionFile(file.id); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = file.originalName; anchor.click(); URL.revokeObjectURL(url) }
  if (loading) return <div className="panel">Đang tải...</div>
  if (!data) return <div className="alert error">{error}</div>
  return <div><div className="page-title"><h2>Đánh giá tiến độ: {data.groupName}</h2><p>{data.requirementTitle} · {data.classCode}</p><StatusBadge status={data.status} /></div>{error && <div className="alert error">{error}</div>}
    <Card title="Lịch sử bài nộp"><List dataSource={data.attempts || []} renderItem={attempt => <List.Item><List.Item.Meta title={`Lần ${attempt.attemptNumber} · ${statusLabel(attempt.status)}`} description={<><p>{formatDateTimeVi(attempt.submittedAt)}</p>{attempt.files.map(file => <Button key={file.id} type="link" icon={<DownloadOutlined />} onClick={() => download(file)}>{file.originalName}</Button>)}{attempt.links.map(link => <p key={link.id}><a href={link.url} target="_blank" rel="noreferrer">{link.url}</a></p>)}</>} /></List.Item>} /></Card>
    <Card title="Đánh giá"><Space direction="vertical" size="middle" style={{ width: '100%' }}><Button onClick={() => act(() => changeReviewStatus(id, 'UNDER_REVIEW'))}>Đánh dấu chờ đánh giá</Button><Input.TextArea rows={5} value={comment} onChange={event => setComment(event.target.value)} placeholder="Phản hồi cho sinh viên" /><Checkbox checked={revision} onChange={event => setRevision(event.target.checked)}>Yêu cầu chỉnh sửa</Checkbox>{revision && <Input.TextArea required rows={3} value={reason} onChange={event => setReason(event.target.value)} placeholder="Lý do cần chỉnh sửa" />}<Button type="primary" onClick={() => act(() => saveFeedback(id, { comment, revisionRequired: revision, revisionReason: reason }))}>Lưu đánh giá</Button></Space></Card>
    <Card title="Điểm tiến độ"><Space direction="vertical" style={{ width: '100%' }}>{data.criteria?.length ? data.criteria.map(criterion => <label key={criterion.id}>{criterion.name} (tối đa {criterion.maxScore})<InputNumber min={0} max={criterion.maxScore} step={0.01} value={scores[criterion.id]} onChange={value => setScores({ ...scores, [criterion.id]: value })} /></label>) : <label>Điểm tổng / 10<InputNumber min={0} max={10} step={0.01} value={total} onChange={setTotal} /></label>}<strong>Tổng điểm: {data.criteria?.length ? sum : total || 0}/10</strong><Space><Button onClick={() => grade(false)}>Lưu nháp</Button><Button type="primary" onClick={() => grade(true)}>Công bố</Button></Space></Space></Card>
  </div>
}
