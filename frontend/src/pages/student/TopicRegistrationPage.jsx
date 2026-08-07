import { useEffect, useState } from 'react'
import { getMyGroup, getTopic, saveTopic } from '../../api/groupsApi'
import { LoadingState, StatusBadge } from '../../components/common/UiState'

export default function TopicRegistrationPage() {
  const empty = { title: '', description: '', technologies: '', objectives: '', notes: '' }
  const [group, setGroup] = useState(null), [topic, setTopic] = useState(null), [form, setForm] = useState(empty), [loading, setLoading] = useState(true), [error, setError] = useState('')
  const load = async () => { try { const currentGroup = (await getMyGroup()).data; setGroup(currentGroup); try { const currentTopic = (await getTopic(currentGroup.id)).data; setTopic(currentTopic); setForm(currentTopic) } catch (requestError) { if (requestError.status !== 404) throw requestError } } catch (requestError) { setError(requestError.message) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])
  const submit = async event => { event.preventDefault(); try { setError(''); const currentTopic = (await saveTopic(group.id, form, Boolean(topic))).data; setTopic(currentTopic); setForm(currentTopic) } catch (requestError) { setError(requestError.message) } }
  if (loading) return <LoadingState />
  return <div><div className="page-title"><h2>Đăng ký đề tài</h2><p>Trưởng nhóm gửi đề tài để giảng viên phụ trách duyệt.</p></div>{error && <div className="alert error">{error}</div>}{topic && <div className="panel"><div className="row-between"><strong>Trạng thái đề tài</strong><StatusBadge status={topic.status} /></div>{topic.reviewComment && <p>Phản hồi: {topic.reviewComment}</p>}</div>}{group && <form className="panel" onSubmit={submit}><input required placeholder="Tên đề tài" value={form.title || ''} onChange={event => setForm({ ...form, title: event.target.value })} /><textarea required placeholder="Mô tả" value={form.description || ''} onChange={event => setForm({ ...form, description: event.target.value })} /><input placeholder="Công nghệ dự kiến" value={form.technologies || ''} onChange={event => setForm({ ...form, technologies: event.target.value })} /><textarea placeholder="Mục tiêu" value={form.objectives || ''} onChange={event => setForm({ ...form, objectives: event.target.value })} /><textarea placeholder="Ghi chú" value={form.notes || ''} onChange={event => setForm({ ...form, notes: event.target.value })} /><button className="btn-primary" disabled={topic && !['PENDING', 'REQUIRES_REVISION'].includes(topic.status)}>Lưu đăng ký</button></form>}</div>
}
