import { useEffect, useMemo, useState } from 'react'
import { Select } from 'antd'
import { Link } from 'react-router-dom'
import { listStudentRequirements } from '../../api/submissionRequirementsApi'
import { EmptyState, LoadingState, StatusBadge } from '../../components/common/UiState'
import { formatDateTimeVi, statusLabel } from '../../utils/formatters'

const itemLabels = { REPORT: 'Báo cáo', SLIDE: 'Slide', SOURCE_CODE: 'Mã nguồn', OTHER: 'Tệp khác', GITHUB_LINK: 'GitHub', VIDEO_LINK: 'Video' }

export default function SubmissionRequirementsPage() {
  const [items, setItems] = useState([]), [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true), [error, setError] = useState('')
  const [classId, setClassId] = useState(''), [status, setStatus] = useState('')
  useEffect(() => { listStudentRequirements().then(response => setItems(response.data || [])).catch(() => setError('Không tải được dữ liệu. Vui lòng thử lại.')).finally(() => setLoading(false)) }, [])
  const classes = useMemo(() => [...new Map(items.map(item => [item.classId, { value: item.classId, label: `${item.classCode} — ${item.className}` }])).values()], [items])
  const visible = items.filter(item => (!classId || item.classId === classId) && (!status || item.effectiveStatus === status))
  return <div className="student-workflow">
    <div className="page-title"><h2>Yêu cầu nộp bài</h2><p>Xem tất cả yêu cầu, thời gian mở và deadline của các lớp đang tham gia.</p></div>
    {error && <div className="alert error">{error}</div>}
    <div className="workflow-filters"><Select allowClear placeholder="Tất cả lớp học phần" value={classId || undefined} options={classes} onChange={value => setClassId(value || '')} /><Select allowClear placeholder="Tất cả trạng thái" value={status || undefined} options={[...new Set(items.map(item => item.effectiveStatus))].map(value => ({ value, label: statusLabel(value) }))} onChange={value => setStatus(value || '')} /></div>
    <div className="panel">{loading ? <LoadingState /> : visible.length ? <div className="table-wrap"><table><thead><tr><th>Yêu cầu</th><th>Lớp học phần</th><th>Mở từ</th><th>Deadline</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{visible.map(item => <tr key={item.id}><td><strong>{item.title}</strong></td><td>{item.classCode}</td><td>{formatDateTimeVi(item.startAt)}</td><td>{formatDateTimeVi(item.deadline)}</td><td><StatusBadge status={item.effectiveStatus} /></td><td><div className="toolbar-actions"><button className="btn-light small" onClick={() => setSelected(item)}>Chi tiết</button>{['OPEN', 'OPEN_LATE'].includes(item.effectiveStatus) && <Link className="btn-primary small" to={`/student/submission-requirements/${item.id}/submit`}>Nộp bài</Link>}</div></td></tr>)}</tbody></table></div> : <EmptyState title="Chưa có yêu cầu nộp bài" description="Yêu cầu của các lớp học phần sẽ xuất hiện tại đây." />}</div>
    {selected && <div className="panel"><div className="row-between"><div><h3>{selected.title}</h3><p className="muted-text">{selected.classCode}</p></div><button className="btn-light" onClick={() => setSelected(null)}>Đóng</button></div><p>{selected.description || 'Không có mô tả.'}</p>{selected.instructions && <p><strong>Hướng dẫn:</strong> {selected.instructions}</p>}<div className="detail-grid"><div><span>Bắt đầu</span><strong>{formatDateTimeVi(selected.startAt)}</strong></div><div><span>Deadline</span><strong>{formatDateTimeVi(selected.deadline)}</strong></div><div><span>Số lần nộp tối đa</span><strong>{selected.maxAttempts}</strong></div><div><span>Nộp trễ</span><strong>{selected.allowLate ? 'Cho phép' : 'Không cho phép'}</strong></div><div><span>Nộp lại</span><strong>{selected.allowResubmission ? 'Cho phép' : 'Không cho phép'}</strong></div></div><p><strong>Nội dung bắt buộc:</strong> {(selected.requiredItems || []).map(item => itemLabels[item.type] || item.type).join(', ') || 'Không có'}</p><div className="form-actions"><Link className="btn-primary small" to={`/student/submission-requirements/${selected.id}/submit`}>Đến trang nộp bài</Link></div></div>}
  </div>
}
