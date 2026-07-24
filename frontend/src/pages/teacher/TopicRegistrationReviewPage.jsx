import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getLecturerTopic, reviewTopic } from '../../api/groupsApi'

export default function TopicRegistrationReviewPage() {
  const { registrationId } = useParams(), navigate = useNavigate()
  const [topic, setTopic] = useState(null), [error, setError] = useState('')
  const load = () => getLecturerTopic(registrationId).then(r => setTopic(r.data)).catch(e => setError(e.message))
  useEffect(load, [registrationId])
  const review = async status => {
    const needsReason = status !== 'APPROVED'
    const comment = needsReason ? window.prompt(status === 'REJECTED' ? 'Nhập lý do từ chối:' : 'Nhập nội dung cần chỉnh sửa:') : ''
    if (needsReason && !comment) return
    try { await reviewTopic(registrationId, { status, comment }); await load() } catch (e) { setError(e.message) }
  }
  if (!topic) return <div className="panel">{error || 'Đang tải đăng ký...'}</div>
  return <div><div className="page-title row-between"><div><h2>{topic.title}</h2>
    <p>{topic.roundName || 'Đăng ký đề tài'} · {topic.classCode} · {topic.groupName}</p></div>
    <button className="btn-light" onClick={() => navigate(-1)}>Quay lại</button></div>
    {error && <div className="alert error">{error}</div>}
    <div className="panel workflow-detail-grid">
      <div><small>Trạng thái</small><strong>{topic.status}</strong></div>
      <div><small>Số lần chỉnh sửa</small><strong>{topic.revisionCount || 0}</strong></div>
      <div><small>Thời gian gửi</small><strong>{new Date(topic.createdAt).toLocaleString('vi-VN')}</strong></div>
      <section><h3>Mô tả</h3><p>{topic.description}</p><h3>Mục tiêu</h3><p>{topic.objectives || '—'}</p>
        <h3>Phạm vi</h3><p>{topic.scope || '—'}</p><h3>Công nghệ dự kiến</h3><p>{topic.technologies || '—'}</p>
        <h3>Kết quả dự kiến</h3><p>{topic.expectedResults || '—'}</p>
        {topic.referenceUrl && <p><a href={topic.referenceUrl} target="_blank" rel="noopener noreferrer">Mở link tham khảo</a></p>}
        {topic.reviewComment && <div className="alert"><strong>Phản hồi:</strong> {topic.reviewComment}</div>}</section>
    </div>
    <div className="panel form-actions"><button className="btn-primary" onClick={() => review('APPROVED')}>Duyệt</button>
      <button onClick={() => review('REQUIRES_REVISION')}>Yêu cầu chỉnh sửa</button>
      <button onClick={() => review('REJECTED')}>Từ chối</button></div>
  </div>
}
