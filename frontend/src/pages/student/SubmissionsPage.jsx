import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listStudentRequirements } from '../../api/submissionRequirementsApi'
import { EmptyState, LoadingState, StatusBadge } from '../../components/common/UiState'
import { formatDateTimeVi } from '../../utils/formatters'

export default function SubmissionsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState('')
  useEffect(() => { listStudentRequirements().then(response => setItems(response.data || [])).catch(() => setError('Không tải được danh sách yêu cầu nộp bài.')).finally(() => setLoading(false)) }, [])
  return <div><div className="page-title"><h2>Bài nộp của nhóm</h2><p>Chọn yêu cầu để nộp tài liệu hoặc xem các lần đã nộp.</p></div>{error && <div className="alert error">{error}</div>}<div className="panel">{loading ? <LoadingState /> : items.length ? <div className="table-wrap"><table><thead><tr><th>Yêu cầu</th><th>Lớp</th><th>Hạn nộp</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td>{item.title}</td><td>{item.classCode}</td><td>{formatDateTimeVi(item.deadline)}</td><td><StatusBadge status={item.effectiveStatus} /></td><td><button onClick={() => navigate(`/student/submission-requirements/${item.id}`)}>Chi tiết</button></td></tr>)}</tbody></table></div> : <EmptyState title="Chưa có yêu cầu nộp bài" />}</div></div>
}
