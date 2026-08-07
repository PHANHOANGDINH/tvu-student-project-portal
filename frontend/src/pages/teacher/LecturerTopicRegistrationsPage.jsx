import { useEffect, useState } from 'react'
import { listLecturerTopics, reviewTopic } from '../../api/groupsApi'
import { StatusBadge } from '../../components/common/UiState'
import { statusLabel } from '../../utils/formatters'

export default function LecturerTopicRegistrationsPage() {
  const [items, setItems] = useState([]), [status, setStatus] = useState(''), [error, setError] = useState(''), [loading, setLoading] = useState(true)
  const load = async () => { setLoading(true); try { setItems((await listLecturerTopics(status)).data || []); setError('') } catch (requestError) { setError(requestError.message) } finally { setLoading(false) } }
  useEffect(() => { load() }, [status])
  const review = async (id, next) => { const comment = next === 'APPROVED' ? '' : window.prompt('Nhập lý do phản hồi:'); if (next !== 'APPROVED' && !comment) return; try { await reviewTopic(id, { status: next, comment }); load() } catch (requestError) { setError(requestError.message) } }
  return <div><div className="page-title"><h2>Duyệt đăng ký đề tài</h2><p>Duyệt đề tài của các lớp học phần bạn phụ trách.</p></div>{error && <div className="alert error">{error}</div>}<div className="panel"><select value={status} onChange={event => setStatus(event.target.value)}><option value="">Tất cả trạng thái</option>{['PENDING', 'APPROVED', 'REJECTED', 'REQUIRES_REVISION'].map(value => <option value={value} key={value}>{statusLabel(value)}</option>)}</select>{loading ? <p>Đang tải...</p> : <table><thead><tr><th>Đề tài</th><th>Nhóm / lớp</th><th>Trạng thái</th><th>Duyệt</th></tr></thead><tbody>{items.map(topic => <tr key={topic.id}><td><strong>{topic.title}</strong><p>{topic.description}</p>{topic.reviewComment && <small>Phản hồi: {topic.reviewComment}</small>}</td><td>{topic.groupName} / {topic.classCode}</td><td><StatusBadge status={topic.status} /></td><td><button onClick={() => review(topic.id, 'APPROVED')}>Duyệt</button> <button onClick={() => review(topic.id, 'REQUIRES_REVISION')}>Yêu cầu sửa</button> <button onClick={() => review(topic.id, 'REJECTED')}>Từ chối</button></td></tr>)}{!items.length && <tr><td colSpan="4">Không có đăng ký đề tài.</td></tr>}</tbody></table>}</div></div>
}
