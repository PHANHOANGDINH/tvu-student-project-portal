import { useEffect, useMemo, useState } from 'react'
import { Select } from 'antd'
import { Link } from 'react-router-dom'
import { listStudentRequirements } from '../../api/submissionRequirementsApi'
import { EmptyState, LoadingState, StatusBadge } from '../../components/common/UiState'
import { formatDateTimeVi, submissionRequirementStatusLabel } from '../../utils/formatters'

export default function SubmissionRequirementsPage() {
  const [items, setItems] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState('')
  const [classId, setClassId] = useState(''), [status, setStatus] = useState('')
  useEffect(() => { listStudentRequirements().then(response => setItems(response.data || [])).catch(() => setError('Không tải được dữ liệu. Vui lòng thử lại.')).finally(() => setLoading(false)) }, [])
  const classes = useMemo(() => [...new Map(items.map(item => [item.classId, { value: item.classId, label: `${item.classCode} — ${item.className}` }])).values()], [items])
  const visible = items.filter(item => (!classId || item.classId === classId) && (!status || item.effectiveStatus === status))
  return <div className="student-workflow"><div className="page-title"><h2>Yêu cầu nộp bài</h2><p>Xem tất cả yêu cầu và hạn nộp của các lớp đang tham gia.</p></div>{error && <div className="alert error">{error}</div>}<div className="workflow-filters"><Select allowClear placeholder="Tất cả lớp học phần" value={classId || undefined} options={classes} onChange={value => setClassId(value || '')} /><Select allowClear placeholder="Tất cả trạng thái" value={status || undefined} options={[...new Set(items.map(item => item.effectiveStatus))].map(value => ({ value, label: submissionRequirementStatusLabel(value) }))} onChange={value => setStatus(value || '')} /></div><div className="panel">{loading ? <LoadingState /> : visible.length ? <div className="table-wrap"><table><thead><tr><th>Yêu cầu</th><th>Lớp học phần</th><th>Hạn nộp</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{visible.map(item => <tr key={item.id}><td><strong>{item.title}</strong></td><td>{item.classCode}</td><td>{formatDateTimeVi(item.deadline)}</td><td><StatusBadge status={item.effectiveStatus} /></td><td><Link className="btn-light small" to={`/student/submission-requirements/${item.id}`}>Chi tiết</Link></td></tr>)}</tbody></table></div> : <EmptyState title="Chưa có yêu cầu nộp bài" description="Yêu cầu của các lớp học phần sẽ xuất hiện tại đây." />}</div></div>
}
