import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { lecturerRequirementSubmissions } from '../../api/submissionsApi'
import { StatusBadge } from '../../components/common/UiState'
import { statusLabel } from '../../utils/formatters'

const statuses = ['SUBMITTED', 'LATE', 'RESUBMITTED', 'UNDER_REVIEW', 'REQUIRES_REVISION', 'GRADED']

export default function SubmissionsPage() {
  const navigate = useNavigate()
  const [requirementId, setRequirementId] = useState(''), [status, setStatus] = useState(''), [items, setItems] = useState([]), [error, setError] = useState('')
  const load = () => lecturerRequirementSubmissions(requirementId).then(response => setItems(response.data || [])).catch(() => setError('Không tải được danh sách bài nộp.'))
  const shown = items.filter(item => !status || item.status === status)
  return <div><div className="page-title"><h2>Bài nộp sinh viên</h2><p>Xem bài nộp thuộc yêu cầu và lớp bạn phụ trách.</p></div>{error && <div className="alert error">{error}</div>}<div className="panel"><div className="form-row"><input placeholder="Mã yêu cầu nộp bài" value={requirementId} onChange={event => setRequirementId(event.target.value)} /><select value={status} onChange={event => setStatus(event.target.value)}><option value="">Tất cả trạng thái</option>{statuses.map(value => <option key={value} value={value}>{statusLabel(value)}</option>)}</select><button onClick={load}>Tải danh sách</button></div><table><thead><tr><th>Nhóm</th><th>Yêu cầu / lớp</th><th>Lần nộp</th><th>Trạng thái</th></tr></thead><tbody>{shown.map(item => <tr key={item.id} onClick={() => navigate(`/lecturer/submissions/${item.id}/review`)}><td>{item.groupName}</td><td>{item.requirementTitle} / {item.classCode}</td><td>{item.latestAttemptNumber}</td><td><StatusBadge status={item.status} /></td></tr>)}{!shown.length && <tr><td colSpan="4">Chưa có bài nộp.</td></tr>}</tbody></table></div></div>
}
