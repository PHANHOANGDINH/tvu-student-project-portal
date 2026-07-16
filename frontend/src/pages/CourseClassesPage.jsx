import { useEffect, useMemo, useState } from 'react'
import { getUsers } from '../api/adminApi'
import {
  academicYearsApi,
  addCourseClassStudents,
  assignCourseClassLecturer,
  createCourseClass,
  getCourseClasses,
  getCourseClassStudents,
  getLecturerCourseClasses,
  getLecturerCourseClassStudents,
  getStudentCourseClasses,
  removeCourseClassStudent,
  semestersApi,
  subjectsApi,
  updateCourseClass,
  updateCourseClassStatus
} from '../api/academicApi'
import { USER_ROLES } from '../constants/roles'

const emptyForm = { code: '', subjectId: '', semesterId: '', lecturerId: '', maxStudents: '', status: 'ACTIVE' }
const statuses = ['ACTIVE', 'INACTIVE', 'COMPLETED', 'CANCELLED']
const statusText = { ACTIVE: 'Đang mở', INACTIVE: 'Tạm khóa', COMPLETED: 'Đã hoàn thành', CANCELLED: 'Đã hủy' }

function unwrapItems(response) {
  const data = response?.data
  if (Array.isArray(data)) return data
  return data?.items || []
}

function unwrapPagination(response, fallbackPage, fallbackSize) {
  return response?.data?.pagination || response?.pagination || { page: fallbackPage, pageSize: fallbackSize, total: 0 }
}

function CourseClassesPage({ mode = 'admin' }) {
  const isAdmin = mode === 'admin'
  const isLecturer = mode === 'lecturer'
  const [items, setItems] = useState([])
  const [subjects, setSubjects] = useState([])
  const [semesters, setSemesters] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [lecturers, setLecturers] = useState([])
  const [students, setStudents] = useState([])
  const [classStudents, setClassStudents] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [filters, setFilters] = useState({ search: '', status: '', subjectId: '', semesterId: '', page: 1, pageSize: 10 })
  const [studentSearch, setStudentSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [studentLoading, setStudentLoading] = useState(false)

  const title = isAdmin ? 'Lớp học phần' : isLecturer ? 'Lớp giảng dạy' : 'Lớp đang học'

  async function loadLookups() {
    if (!isAdmin) return
    const [subjectRes, semesterRes, yearRes, lecturerRes, studentRes] = await Promise.all([
      subjectsApi.list({ pageSize: 100, status: 'ACTIVE' }),
      semestersApi.list({ pageSize: 100, status: 'ACTIVE' }),
      academicYearsApi.list({ pageSize: 100, status: 'ACTIVE' }),
      getUsers({ role: USER_ROLES.LECTURER, status: 'ACTIVE', pageSize: 100 }),
      getUsers({ role: USER_ROLES.STUDENT, status: 'ACTIVE', pageSize: 200 })
    ])
    setSubjects(unwrapItems(subjectRes))
    setSemesters(unwrapItems(semesterRes))
    setAcademicYears(unwrapItems(yearRes))
    setLecturers(unwrapItems(lecturerRes))
    setStudents(unwrapItems(studentRes))
  }

  async function loadData(nextFilters = filters) {
    setLoading(true)
    setError('')
    try {
      const loader = isAdmin ? getCourseClasses : isLecturer ? getLecturerCourseClasses : getStudentCourseClasses
      const response = await loader(nextFilters)
      setItems(unwrapItems(response))
      setPagination(unwrapPagination(response, nextFilters.page, nextFilters.pageSize))
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách lớp học phần')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLookups().catch((err) => setError(err.message || 'Không thể tải dữ liệu danh mục'))
    loadData()
  }, [mode])

  function setFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value, page: 1 }))
  }

  function edit(item) {
    setEditing(item)
    setForm({
      code: item.code || '',
      subjectId: item.subjectId || '',
      semesterId: item.semesterId || '',
      lecturerId: item.lecturerId || '',
      maxStudents: item.maxStudents || '',
      status: item.status || 'ACTIVE'
    })
    setMessage('')
    setError('')
  }

  function resetForm() {
    setEditing(null)
    setForm(emptyForm)
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    const payload = { ...form, lecturerId: form.lecturerId || null, maxStudents: form.maxStudents || null }
    try {
      if (editing) {
        await updateCourseClass(editing.id, payload)
        setMessage('Đã cập nhật lớp học phần')
      } else {
        await createCourseClass(payload)
        setMessage('Đã tạo lớp học phần')
      }
      resetForm()
      await loadData()
    } catch (err) {
      setError(err.message || 'Không thể lưu lớp học phần')
    }
  }

  async function changeStatus(item) {
    const next = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    if (!window.confirm(`Chuy\u1ec3n tr\u1ea1ng th\u00e1i l\u1edbp ${item.code} sang ${statusText[next]}?`)) return
    try {
      await updateCourseClassStatus(item.id, next)
      setMessage('Đã cập nhật trạng thái')
      await loadData()
    } catch (err) {
      setError(err.message || 'Không thể cập nhật trạng thái')
    }
  }

  async function changeLecturer(item, lecturerId) {
    try {
      await assignCourseClassLecturer(item.id, lecturerId || null)
      setMessage('Đã cập nhật giảng viên phụ trách')
      await loadData()
    } catch (err) {
      setError(err.message || 'Không thể phân công giảng viên')
    }
  }

  async function openStudents(item) {
    setSelectedClass(item)
    setSelectedStudentId('')
    setStudentSearch('')
    await loadStudents(item, '')
  }

  async function loadStudents(item = selectedClass, search = studentSearch) {
    if (!item) return
    setStudentLoading(true)
    setError('')
    try {
      const loader = isLecturer ? getLecturerCourseClassStudents : getCourseClassStudents
      const response = await loader(item.id, { search, pageSize: 100 })
      setClassStudents(unwrapItems(response))
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách sinh viên')
    } finally {
      setStudentLoading(false)
    }
  }

  async function addStudent() {
    if (!selectedClass || !selectedStudentId) return
    try {
      await addCourseClassStudents(selectedClass.id, [Number(selectedStudentId)])
      setSelectedStudentId('')
      setMessage('Đã thêm sinh viên')
      await loadStudents(selectedClass)
      await loadData()
    } catch (err) {
      setError(err.message || 'Không thể thêm sinh viên')
    }
  }

  async function removeStudent(student) {
    if (!window.confirm(`X\u00f3a ${student.fullName || student.email} kh\u1ecfi l\u1edbp n\u00e0y?`)) return
    try {
      await removeCourseClassStudent(selectedClass.id, student.id)
      setMessage('Đã xóa sinh viên khỏi lớp')
      await loadStudents(selectedClass)
      await loadData()
    } catch (err) {
      setError(err.message || 'Không thể xóa sinh viên khỏi lớp')
    }
  }

  async function pageTo(nextPage) {
    if (nextPage < 1) return
    const next = { ...filters, page: nextPage }
    setFilters(next)
    await loadData(next)
  }

  const selectedStudentIds = useMemo(() => new Set(classStudents.map((student) => student.id)), [classStudents])
  const availableStudents = students.filter((student) => !selectedStudentIds.has(student.id))
  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / (pagination.pageSize || filters.pageSize)))

  return (
    <div className="page">
      <div className="row-between">
        <div>
          <h2 className="page-title">{title}</h2>
          <p className="page-subtitle">{isAdmin ? 'Quản lý môn học, học kỳ, giảng viên và sinh viên trong lớp học phần.' : 'Xem các lớp học phần thuộc tài khoản của bạn.'}</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      {isAdmin && (
        <section className="panel">
          <form className="form-grid" onSubmit={submit}>
            <div className="form-group"><label>Mã lớp</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CT101-01" /></div>
            <div className="form-group"><label>Môn học</label><select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}><option value="">Chọn môn học</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}</select></div>
            <div className="form-group"><label>Học kỳ</label><select value={form.semesterId} onChange={(e) => setForm({ ...form, semesterId: e.target.value })}><option value="">Chọn học kỳ</option>{semesters.map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}</select></div>
            <div className="form-group"><label>Giảng viên</label><select value={form.lecturerId} onChange={(e) => setForm({ ...form, lecturerId: e.target.value })}><option value="">Chưa phân công</option>{lecturers.map((item) => <option key={item.id} value={item.id}>{item.fullName} - {item.email}</option>)}</select></div>
            <div className="form-group"><label>Sĩ số tối đa</label><input type="number" min="1" value={form.maxStudents} onChange={(e) => setForm({ ...form, maxStudents: e.target.value })} /></div>
            <div className="form-group"><label>Trạng thái</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{statuses.map((item) => <option key={item} value={item}>{statusText[item]}</option>)}</select></div>
            <div className="form-actions"><button className="btn-primary" type="submit">{editing ? 'C?p nh?t' : 'T?o m?i'}</button>{editing && <button className="btn-light" type="button" onClick={resetForm}>Hủy</button>}</div>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="filter-grid">
          <input value={filters.search} onChange={(e) => setFilter('search', e.target.value)} placeholder="Tìm mã lớp, môn học hoặc giảng viên" />
          <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}><option value="">Tất cả trạng thái</option>{statuses.map((item) => <option key={item} value={item}>{statusText[item]}</option>)}</select>
          {isAdmin && <select value={filters.subjectId} onChange={(e) => setFilter('subjectId', e.target.value)}><option value="">Tất cả môn học</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}</select>}
          {isAdmin && <select value={filters.semesterId} onChange={(e) => setFilter('semesterId', e.target.value)}><option value="">Tất cả học kỳ</option>{semesters.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}</select>}
          <button className="btn-light" type="button" onClick={() => loadData({ ...filters, page: 1 })}>Lọc</button>
        </div>
        {isAdmin && academicYears.length > 0 && <p className="filter-summary">Năm học đang dùng: {academicYears.map((item) => item.name).join(', ')}</p>}
      </section>

      <section className="panel">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Mã lớp</th><th>Môn học</th><th>Học kỳ</th><th>Giảng viên</th><th>Sinh viên</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.code}</td>
                  <td>{item.subjectCode} - {item.subjectName}</td>
                  <td>{item.semesterName}<br />{item.academicYearName}</td>
                  <td>{isAdmin ? <select value={item.lecturerId || ''} onChange={(e) => changeLecturer(item, e.target.value)}><option value="">Chưa phân công</option>{lecturers.map((lecturer) => <option key={lecturer.id} value={lecturer.id}>{lecturer.fullName}</option>)}</select> : (item.lecturerName || '-')}</td>
                  <td>{item.studentCount || 0}{item.maxStudents ? ` / ${item.maxStudents}` : ''}</td>
                  <td><span className={`badge ${item.status === 'ACTIVE' ? 'green' : ''}`}>{statusText[item.status] || item.status}</span></td>
                  <td className="card-actions">
                    {isAdmin && <button className="btn-light" type="button" onClick={() => edit(item)}>Sửa</button>}
                    {(isAdmin || isLecturer) && <button className="btn-light" type="button" onClick={() => openStudents(item)}>Sinh viên</button>}
                    {isAdmin && <button className="btn-light" type="button" onClick={() => changeStatus(item)}>{item.status === 'ACTIVE' ? 'Lock' : 'Activate'}</button>}
                  </td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan="7">{loading ? 'Đang tải...' : 'Chưa có lớp học phần'}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="pagination-bar">
          <button className="btn-light" disabled={filters.page <= 1} onClick={() => pageTo(filters.page - 1)}>Trước</button>
          <span>Trang {filters.page} / {totalPages}</span>
          <button className="btn-light" disabled={filters.page >= totalPages} onClick={() => pageTo(filters.page + 1)}>Sau</button>
        </div>
      </section>

      {selectedClass && (isAdmin || isLecturer) && (
        <section className="panel">
          <div className="row-between"><div><h3>Sinh viên lớp {selectedClass.code}</h3><p>{selectedClass.subjectName}</p></div><button className="btn-light" onClick={() => setSelectedClass(null)}>Đóng</button></div>
          <div className="filter-grid"><input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Tìm sinh viên" /><button className="btn-light" onClick={() => loadStudents(selectedClass, studentSearch)}>Tìm kiếm</button></div>
          {isAdmin && <div className="student-add-row"><select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}><option value="">Chọn sinh viên</option>{availableStudents.map((student) => <option key={student.id} value={student.id}>{student.fullName} - {student.email}</option>)}</select><button className="btn-primary small" onClick={addStudent}>Thêm</button></div>}
          <table><thead><tr><th>Họ t?n</th><th>Email</th><th>Mã số</th><th>Lớp</th><th>Khoa</th><th>Thao tác</th></tr></thead><tbody>{classStudents.map((student) => <tr key={student.id}><td>{student.fullName}</td><td>{student.email}</td><td>{student.userCode || '-'}</td><td>{student.className || '-'}</td><td>{student.department || '-'}</td><td>{isAdmin ? <button className="btn-danger" onClick={() => removeStudent(student)}>Xóa</button> : '-'}</td></tr>)}{!classStudents.length && <tr><td colSpan="6">{studentLoading ? 'Đang tải...' : 'Chưa có sinh viên'}</td></tr>}</tbody></table>
        </section>
      )}
    </div>
  )
}

export default CourseClassesPage