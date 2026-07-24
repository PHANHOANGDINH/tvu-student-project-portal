import { useEffect, useState } from 'react'
import { listStudentTopicRounds } from '../../api/topicRoundsApi'
export default function TopicRoundsPage() {
  const [items, setItems] = useState([]), [error, setError] = useState('')
  useEffect(() => { listStudentTopicRounds().then(r => setItems(r.data || []))
    .catch(() => setError('Không thể tải vòng đăng ký đề tài.')) }, [])
  return <div><div className="page-title"><h2>Vòng đăng ký đề tài</h2><p>Theo dõi thời hạn đăng ký của các lớp đang học.</p></div>
    {error && <div className="alert error">{error}</div>}<div className="panel"><table><thead><tr><th>Vòng đăng ký</th><th>Lớp</th><th>Thời gian</th><th>Trạng thái</th></tr></thead>
      <tbody>{items.map(x => <tr key={x.id}><td><strong>{x.name}</strong><small>{x.description}</small></td><td>{x.classCode}</td>
        <td>{new Date(x.startAt).toLocaleString('vi-VN')} – {new Date(x.endAt).toLocaleString('vi-VN')}</td><td>{x.status}</td></tr>)}
        {!items.length && <tr><td colSpan="4">Hiện chưa có vòng đăng ký nào.</td></tr>}</tbody></table></div></div>
}
