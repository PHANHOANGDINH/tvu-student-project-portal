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
const statusText = { ACTIVE: 'Active', INACTIVE: 'Inactive', COMPLETED: 'Completed', CANCELLED: 'Cancelled' }

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

  const title = isAdmin ? 'Course classes' : isLecturer ? 'My teaching classes' : 'My enrolled classes'

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
      setError(err.message || 'Cannot load course classes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLookups().catch((err) => setError(err.message || 'Cannot load lookup data'))
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
        setMessage('Course class updated')
      } else {
        await createCourseClass(payload)
        setMessage('Course class created')
      }
      resetForm()
      await loadData()
    } catch (err) {
      setError(err.message || 'Cannot save course class')
    }
  }

  async function changeStatus(item) {
    const next = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    if (!window.confirm(`Change ${item.code} to ${next}?`)) return
    try {
      await updateCourseClassStatus(item.id, next)
      setMessage('Status updated')
      await loadData()
    } catch (err) {
      setError(err.message || 'Cannot update status')
    }
  }

  async function changeLecturer(item, lecturerId) {
    try {
      await assignCourseClassLecturer(item.id, lecturerId || null)
      setMessage('Lecturer assignment updated')
      await loadData()
    } catch (err) {
      setError(err.message || 'Cannot assign lecturer')
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
      setError(err.message || 'Cannot load students')
    } finally {
      setStudentLoading(false)
    }
  }

  async function addStudent() {
    if (!selectedClass || !selectedStudentId) return
    try {
      await addCourseClassStudents(selectedClass.id, [Number(selectedStudentId)])
      setSelectedStudentId('')
      setMessage('Student added')
      await loadStudents(selectedClass)
      await loadData()
    } catch (err) {
      setError(err.message || 'Cannot add student')
    }
  }

  async function removeStudent(student) {
    if (!window.confirm(`Remove ${student.fullName || student.email} from this class?`)) return
    try {
      await removeCourseClassStudent(selectedClass.id, student.id)
      setMessage('Student removed')
      await loadStudents(selectedClass)
      await loadData()
    } catch (err) {
      setError(err.message || 'Cannot remove student')
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
          <p className="page-subtitle">{isAdmin ? 'Manage subjects, semesters, lecturers and student enrollments.' : 'View course classes available to your account.'}</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      {isAdmin && (
        <section className="panel">
          <form className="form-grid" onSubmit={submit}>
            <div className="form-group"><label>Code</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CT101-01" /></div>
            <div className="form-group"><label>Subject</label><select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}><option value="">Select subject</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}</select></div>
            <div className="form-group"><label>Semester</label><select value={form.semesterId} onChange={(e) => setForm({ ...form, semesterId: e.target.value })}><option value="">Select semester</option>{semesters.map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}</select></div>
            <div className="form-group"><label>Lecturer</label><select value={form.lecturerId} onChange={(e) => setForm({ ...form, lecturerId: e.target.value })}><option value="">Unassigned</option>{lecturers.map((item) => <option key={item.id} value={item.id}>{item.fullName} - {item.email}</option>)}</select></div>
            <div className="form-group"><label>Max students</label><input type="number" min="1" value={form.maxStudents} onChange={(e) => setForm({ ...form, maxStudents: e.target.value })} /></div>
            <div className="form-group"><label>Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{statuses.map((item) => <option key={item} value={item}>{statusText[item]}</option>)}</select></div>
            <div className="form-actions"><button className="btn-primary" type="submit">{editing ? 'Update' : 'Create'}</button>{editing && <button className="btn-light" type="button" onClick={resetForm}>Cancel</button>}</div>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="filter-grid">
          <input value={filters.search} onChange={(e) => setFilter('search', e.target.value)} placeholder="Search code, subject or lecturer" />
          <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}><option value="">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{statusText[item]}</option>)}</select>
          {isAdmin && <select value={filters.subjectId} onChange={(e) => setFilter('subjectId', e.target.value)}><option value="">All subjects</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}</select>}
          {isAdmin && <select value={filters.semesterId} onChange={(e) => setFilter('semesterId', e.target.value)}><option value="">All semesters</option>{semesters.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}</select>}
          <button className="btn-light" type="button" onClick={() => loadData({ ...filters, page: 1 })}>Filter</button>
        </div>
        {isAdmin && academicYears.length > 0 && <p className="filter-summary">Active academic years: {academicYears.map((item) => item.name).join(', ')}</p>}
      </section>

      <section className="panel">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Code</th><th>Subject</th><th>Semester</th><th>Lecturer</th><th>Students</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.code}</td>
                  <td>{item.subjectCode} - {item.subjectName}</td>
                  <td>{item.semesterName}<br />{item.academicYearName}</td>
                  <td>{isAdmin ? <select value={item.lecturerId || ''} onChange={(e) => changeLecturer(item, e.target.value)}><option value="">Unassigned</option>{lecturers.map((lecturer) => <option key={lecturer.id} value={lecturer.id}>{lecturer.fullName}</option>)}</select> : (item.lecturerName || '-')}</td>
                  <td>{item.studentCount || 0}{item.maxStudents ? ` / ${item.maxStudents}` : ''}</td>
                  <td><span className={`badge ${item.status === 'ACTIVE' ? 'green' : ''}`}>{statusText[item.status] || item.status}</span></td>
                  <td className="card-actions">
                    {isAdmin && <button className="btn-light" type="button" onClick={() => edit(item)}>Edit</button>}
                    {(isAdmin || isLecturer) && <button className="btn-light" type="button" onClick={() => openStudents(item)}>Students</button>}
                    {isAdmin && <button className="btn-light" type="button" onClick={() => changeStatus(item)}>{item.status === 'ACTIVE' ? 'Lock' : 'Activate'}</button>}
                  </td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan="7">{loading ? 'Loading...' : 'No course classes found'}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="pagination-bar">
          <button className="btn-light" disabled={filters.page <= 1} onClick={() => pageTo(filters.page - 1)}>Previous</button>
          <span>Page {filters.page} / {totalPages}</span>
          <button className="btn-light" disabled={filters.page >= totalPages} onClick={() => pageTo(filters.page + 1)}>Next</button>
        </div>
      </section>

      {selectedClass && (isAdmin || isLecturer) && (
        <section className="panel">
          <div className="row-between"><div><h3>Students in {selectedClass.code}</h3><p>{selectedClass.subjectName}</p></div><button className="btn-light" onClick={() => setSelectedClass(null)}>Close</button></div>
          <div className="filter-grid"><input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Search students" /><button className="btn-light" onClick={() => loadStudents(selectedClass, studentSearch)}>Search</button></div>
          {isAdmin && <div className="student-add-row"><select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}><option value="">Select student</option>{availableStudents.map((student) => <option key={student.id} value={student.id}>{student.fullName} - {student.email}</option>)}</select><button className="btn-primary small" onClick={addStudent}>Add</button></div>}
          <table><thead><tr><th>Name</th><th>Email</th><th>Code</th><th>Class</th><th>Department</th><th>Actions</th></tr></thead><tbody>{classStudents.map((student) => <tr key={student.id}><td>{student.fullName}</td><td>{student.email}</td><td>{student.userCode || '-'}</td><td>{student.className || '-'}</td><td>{student.department || '-'}</td><td>{isAdmin ? <button className="btn-danger" onClick={() => removeStudent(student)}>Remove</button> : '-'}</td></tr>)}{!classStudents.length && <tr><td colSpan="6">{studentLoading ? 'Loading...' : 'No students found'}</td></tr>}</tbody></table>
        </section>
      )}
    </div>
  )
}

export default CourseClassesPage