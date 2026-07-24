import { useEffect, useState } from 'react'
import CourseClassSelect from '../../components/CourseClassSelect'
import { createTopicRound, listLecturerTopicRounds, updateTopicRoundStatus } from '../../api/topicRoundsApi'
const blank = { classId: '', name: '', description: '', startAt: '', endAt: '' }
export default function TopicRoundsPage() {
  const [items, setItems] = useState([]), [form, setForm] = useState(blank)
  const [show, setShow] = useState(false), [error, setError] = useState('')
  const load = () => listLecturerTopicRounds().then(r => setItems(r.data || [])).catch(() => setError('Không thể tải vòng đăng ký.'))
  useEffect(load, [])
  const save = async event => { event.preventDefault(); try { await createTopicRound(form); setShow(false); setForm(blank); load() }
    catch (cause) { setError(cause.message) } }
  const status = async (id, next) => { try { await updateTopicRoundStatus(id, next); load() } catch (cause) { setError(cause.message) } }
  return <div><div className="page-title row-between"><div><h2>Vòng đăng ký đề tài</h2><p>Thiết lập thời gian đăng ký theo lớp học phần.</p></div>
    <button className="btn-primary" onClick={() => setShow(!show)}>Tạo vòng đăng ký</button></div>
    {error && <div className="alert error">{error}</div>}{show && <form className="panel workflow-form" onSubmit={save}>
      <CourseClassSelect role="LECTURER" value={form.classId} onChange={classId => setForm({ ...form, classId })}/>
      <input required placeholder="Tên vòng đăng ký" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/>
      <textarea placeholder="Mô tả" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/>
      <div className="form-row"><label>Bắt đầu<input required type="datetime-local" value={form.startAt} onChange={e => setForm({ ...form, startAt: e.target.value })}/></label>
        <label>Kết thúc<input required type="datetime-local" value={form.endAt} onChange={e => setForm({ ...form, endAt: e.target.value })}/></label></div>
      <button className="btn-primary">Lưu</button></form>}
    <div className="panel"><table><thead><tr><th>Vòng đăng ký</th><th>Lớp</th><th>Thời gian</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
      <tbody>{items.map(x => <tr key={x.id}><td><strong>{x.name}</strong><small>{x.description}</small></td><td>{x.classCode}</td>
        <td>{new Date(x.startAt).toLocaleString('vi-VN')} – {new Date(x.endAt).toLocaleString('vi-VN')}</td><td>{x.status}</td>
        <td>{['DRAFT','CANCELLED'].includes(x.status) && <button onClick={() => status(x.id,'OPEN')}>Mở</button>} {x.status === 'OPEN' && <button onClick={() => status(x.id,'CLOSED')}>Đóng</button>} {x.status !== 'CLOSED' && <button onClick={() => status(x.id,'CANCELLED')}>Hủy</button>}</td></tr>)}
        {!items.length && <tr><td colSpan="5">Chưa có vòng đăng ký đề tài.</td></tr>}</tbody></table></div></div>
}
