import { useEffect, useState } from 'react'
import { Plus, Search, UserRoundCheck, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getUsers } from '../../api/adminApi'
import { createAcademic, listAcademic, setAcademicStatus, updateAcademic } from '../../api/academicsApi'
import Modal from '../../components/common/Modal'
import PageHeader from '../../components/common/PageHeader'
import { EmptyState } from '../../components/common/UiState'

const configs = {
  'academic-years': { fields: [['name', 'Tên năm học', 'text'], ['startDate', 'Ngày bắt đầu', 'date'], ['endDate', 'Ngày kết thúc', 'date']], columns: [['name', 'Tên năm học'], ['startDate', 'Bắt đầu'], ['endDate', 'Kết thúc']] },
  semesters: { fields: [['academicYearId', 'Năm học', 'academic-years'], ['name', 'Tên học kỳ', 'text'], ['code', 'Mã học kỳ', 'text'], ['startDate', 'Ngày bắt đầu', 'date'], ['endDate', 'Ngày kết thúc', 'date']], columns: [['code', 'Mã'], ['name', 'Tên học kỳ'], ['academicYearId', 'Năm học'], ['startDate', 'Bắt đầu'], ['endDate', 'Kết thúc']] },
  subjects: { fields: [['code', 'Mã môn học', 'text'], ['name', 'Tên môn học', 'text'], ['credits', 'Số tín chỉ', 'number'], ['description', 'Mô tả', 'text']], columns: [['code', 'Mã môn'], ['name', 'Tên môn học'], ['credits', 'Tín chỉ']] },
  'course-classes': { fields: [['code', 'Mã lớp học phần', 'text'], ['subjectId', 'Môn học', 'subjects'], ['semesterId', 'Học kỳ', 'semesters'], ['lecturerId', 'Giảng viên phụ trách', 'lecturers'], ['maxStudents', 'Sĩ số tối đa', 'number'], ['status', 'Trạng thái', 'status']], columns: [['code', 'Mã lớp'], ['subjectId', 'Môn học'], ['semesterId', 'Học kỳ'], ['lecturerName', 'Giảng viên phụ trách'], ['status', 'Trạng thái']] }
}
const initial = { status: 'ACTIVE' }
const formatDate = value => value ? new Date(value).toLocaleDateString('vi-VN') : '—'
const statusText = { ACTIVE: 'Hoạt động', INACTIVE: 'Đã khóa', COMPLETED: 'Đã kết thúc', CANCELLED: 'Đã hủy' }

export default function AcademicSummaryPage({ resource, title }) {
  const navigate = useNavigate()
  const key = resource === 'academicYears' ? 'academic-years' : resource === 'courseClasses' ? 'course-classes' : resource
  const config = configs[key]
  const [items, setItems] = useState([])
  const [refs, setRefs] = useState({})
  const [form, setForm] = useState(initial)
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const load = async () => {
    try { setLoading(true); const response = await listAcademic(key, { page, pageSize: 10, search }); setItems(response.data.items || []); setPages(response.data.totalPages || 1) }
    catch (error) { setMessage({ type: 'error', text: error.message }) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [key, page])
  useEffect(() => {
    const types = [...new Set(config.fields.map(field => field[2]).filter(type => configs[type]))]
    const jobs = types.map(type => listAcademic(type, { pageSize: 100 }).then(response => [type, response.data.items || []]))
    if (config.fields.some(field => field[2] === 'lecturers')) jobs.push(getUsers({ role: 'LECTURER', status: 'ACTIVE', pageSize: 100, sortBy: 'fullName', sortOrder: 'asc' }).then(response => ['lecturers', response.data.items || []]))
    Promise.all(jobs).then(values => setRefs(Object.fromEntries(values))).catch(error => setMessage({ type: 'error', text: error.message }))
  }, [key])

  const display = (item, field) => field.endsWith('Date') ? formatDate(item[field]) : field === 'academicYearId' ? item.academicYearName || item[field] : field === 'subjectId' ? item.subjectName || item[field] : field === 'semesterId' ? item.semesterName || item[field] : field === 'status' ? statusText[item[field]] || item[field] : item[field] ?? '—'
  const closeModal = () => { if (!saving) setOpen(false) }
  const openCreate = () => { setEditing(null); setForm(initial); setOpen(true) }
  const edit = item => { const next = {}; config.fields.forEach(([field]) => { next[field] = field.endsWith('Date') && item[field] ? String(item[field]).slice(0, 10) : (item[field] ?? '') }); setForm(next); setEditing(item); setOpen(true) }
  const submit = async event => {
    event.preventDefault()
    if (key === 'course-classes' && editing && String(editing.lecturerId || '') !== String(form.lecturerId || '') && !window.confirm('Xác nhận thay đổi giảng viên phụ trách lớp học phần?')) return
    try { setSaving(true); editing ? await updateAcademic(key, editing.id, form) : await createAcademic(key, form); setMessage({ type: 'success', text: editing ? 'Cập nhật thành công.' : 'Thêm mới thành công.' }); setOpen(false); setEditing(null); setForm(initial); load() }
    catch (error) { setMessage({ type: 'error', text: error.message }) }
    finally { setSaving(false) }
  }

  return <div className="admin-page academic-page">
    <PageHeader eyebrow="Quản lý học vụ" title={title} description={`Quản lý thông tin ${title.toLowerCase()} trong hệ thống.`} actions={<>{key === 'course-classes' && <><button className="btn-light" onClick={() => navigate('/admin/students/import')}><Users size={17} />Danh sách sinh viên</button><button className="btn-light" onClick={() => navigate('/admin/course-classes')}><UserRoundCheck size={17} />Phân công giảng viên</button></>}<button className="btn-primary small" onClick={openCreate}><Plus size={18} />Thêm mới</button></>} />
    {message && <div className={`alert ${message.type}`}>{message.text}</div>}
    <div className="panel academic-list-panel">
      <form className="admin-filterbar compact" onSubmit={event => { event.preventDefault(); page === 1 ? load() : setPage(1) }}><label className="search-field"><Search size={18} /><input aria-label={`Tìm kiếm ${title.toLowerCase()}`} placeholder={`Tìm kiếm ${title.toLowerCase()}...`} value={search} onChange={event => setSearch(event.target.value)} /></label><button className="btn-primary small">Tìm kiếm</button></form>
      {loading ? <div className="skeleton-list">{[1, 2, 3].map(value => <div key={value} />)}</div> : !items.length ? <EmptyState title={`Chưa có ${title.toLowerCase()}`} description="Nhấn “Thêm mới” để bắt đầu tạo dữ liệu." action={<button className="btn-primary small" onClick={openCreate}><Plus size={17} />Thêm mới</button>} /> : <div className="table-wrap"><table><thead><tr>{config.columns.map(column => <th key={column[0]}>{column[1]}</th>)}<th>Trạng thái sử dụng</th><th>Thao tác</th></tr></thead><tbody>{items.map(item => <tr key={item.id}>{config.columns.map(column => <td key={column[0]}>{display(item, column[0])}</td>)}<td><span className={`status-pill ${item.isActive ? 'active' : 'inactive'}`}>{item.isActive ? 'Hoạt động' : 'Đã khóa'}</span></td><td><div className="compact-actions"><button onClick={() => edit(item)}>Sửa</button><button onClick={async () => { if (window.confirm(`${item.isActive ? 'Khóa' : 'Mở khóa'} dữ liệu này?`)) { await setAcademicStatus(key, item.id, !item.isActive); load() } }}>{item.isActive ? 'Khóa' : 'Mở khóa'}</button></div></td></tr>)}</tbody></table></div>}
      <div className="pagination-bar"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</button><span>Trang {page}/{pages}</span><button disabled={page >= pages} onClick={() => setPage(page + 1)}>Sau</button></div>
    </div>
    <Modal open={open} eyebrow={editing ? 'Cập nhật' : 'Thêm mới'} title={`${editing ? 'Cập nhật' : 'Thêm'} ${title.toLowerCase()}`} description={`Nhập đầy đủ thông tin ${title.toLowerCase()} bên dưới.`} onClose={closeModal} closeOnBackdrop={!saving} closeOnEscape={!saving}>
      <form className="modal-form" onSubmit={submit}>
        <div className="form-grid modal-form-grid">{config.fields.map(([field, label, type]) => <label className="form-field-ui" key={field}><span>{label}{!['description', 'maxStudents', 'lecturerId'].includes(field) && <b> *</b>}</span>{configs[type] ? <select required value={form[field] || ''} onChange={event => setForm({ ...form, [field]: event.target.value })}><option value="">-- Chọn --</option>{(refs[type] || []).map(option => <option key={option.id} value={option.id}>{option.code ? `${option.code} — ` : ''}{option.name}</option>)}</select> : type === 'lecturers' ? <select value={form[field] || ''} onChange={event => setForm({ ...form, [field]: event.target.value })}><option value="">Chưa phân công</option>{(refs.lecturers || []).map(option => <option key={option.id} value={option.id}>{option.userCode} — {option.fullName} — {option.email}</option>)}</select> : type === 'status' ? <select value={form[field] || 'ACTIVE'} onChange={event => setForm({ ...form, [field]: event.target.value })}>{Object.entries(statusText).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select> : <input required={!['description', 'maxStudents'].includes(field)} type={type} value={form[field] || ''} onChange={event => setForm({ ...form, [field]: event.target.value })} />}</label>)}</div>
        <footer className="modal-actions"><button type="button" className="btn-light" onClick={closeModal} disabled={saving}>Hủy</button><button className="btn-primary small" disabled={saving}>{saving && <span className="button-spinner" />}{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button></footer>
      </form>
    </Modal>
  </div>
}
