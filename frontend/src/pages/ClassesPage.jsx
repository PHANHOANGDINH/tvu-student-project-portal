import { useEffect, useMemo, useState } from 'react'
import { normalizeRole, USER_ROLES } from '../constants/roles'
import {
  addClassStudentApi,
  createClassApi,
  getClassesApi,
  getClassStudentsApi,
  getUsersApi,
  lockClassApi,
  removeClassStudentApi,
  unlockClassApi,
  updateClassApi
} from '../api/adminApi'

const emptyForm = {
  classCode: '',
  className: '',
  department: '',
  academicYear: ''
}

function ClassesPage() {
  const [classes, setClasses] = useState([])
  const [users, setUsers] = useState([])
  const [students, setStudents] = useState([])

  const [loading, setLoading] = useState(true)
  const [studentLoading, setStudentLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const [selectedClass, setSelectedClass] = useState(null)
  const [selectedStudentId, setSelectedStudentId] = useState('')

  const [studentSearch, setStudentSearch] = useState('')
  const [studentPage, setStudentPage] = useState(1)
  const [studentPagination, setStudentPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  })

  const [filters, setFilters] = useState({
    keyword: '',
    department: '',
    academicYear: '',
    status: ''
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  async function loadInitialData() {
    try {
      setLoading(true)
      setError('')

      const [classesResponse, usersResponse] = await Promise.all([
        getClassesApi(),
        getUsersApi()
      ])

      const classList = classesResponse?.data || []
      const userList = usersResponse?.data || []

      setClasses(Array.isArray(classList) ? classList : [])
      setUsers(Array.isArray(userList) ? userList : [])
    } catch (err) {
      setError(err.message || 'KhĂ´ng thá»ƒ táº£i dá»¯ liá»‡u lá»›p há»c')
    } finally {
      setLoading(false)
    }
  }

  async function loadClasses() {
    try {
      setError('')

      const response = await getClassesApi()
      const list = response?.data || []

      setClasses(Array.isArray(list) ? list : [])
    } catch (err) {
      setError(err.message || 'KhĂ´ng thá»ƒ táº£i danh sĂ¡ch lá»›p há»c')
    }
  }

  async function loadUsers() {
    try {
      const response = await getUsersApi()
      const list = response?.data || []

      setUsers(Array.isArray(list) ? list : [])
    } catch (err) {
      setError(err.message || 'KhĂ´ng thá»ƒ táº£i danh sĂ¡ch ngÆ°á»i dĂ¹ng')
    }
  }

  async function loadClassStudents(classItem, options = {}) {
    try {
      setStudentLoading(true)
      setError('')

      const page = options.page || studentPage
      const search =
        options.search !== undefined ? options.search : studentSearch

      const response = await getClassStudentsApi(classItem.Id, {
        page,
        limit: 10,
        search
      })

      const list = response?.data || []
      const pagination = response?.pagination || {
        page,
        limit: 10,
        total: list.length,
        totalPages: 1
      }

      setStudents(Array.isArray(list) ? list : [])
      setStudentPagination(pagination)
      setStudentPage(pagination.page || page)
    } catch (err) {
      setError(err.message || 'KhĂ´ng thá»ƒ táº£i danh sĂ¡ch sinh viĂªn cá»§a lá»›p')
    } finally {
      setStudentLoading(false)
    }
  }

  function clearMessages() {
    setError('')
    setSuccess('')
  }

  function handleFilterChange(e) {
    const { name, value } = e.target

    setFilters({
      ...filters,
      [name]: value
    })
  }

  function resetFilters() {
    setFilters({
      keyword: '',
      department: '',
      academicYear: '',
      status: ''
    })
  }

  function handleFormChange(e) {
    const { name, value } = e.target

    setForm({
      ...form,
      [name]: value
    })
  }

  function openCreateForm() {
    setEditingClass(null)
    setForm(emptyForm)
    setShowForm(true)
    clearMessages()
  }

  function openEditForm(classItem) {
    setEditingClass(classItem)

    setForm({
      classCode: classItem.ClassCode || '',
      className: classItem.ClassName || '',
      department: classItem.Department || '',
      academicYear: classItem.AcademicYear || ''
    })

    setShowForm(true)
    clearMessages()
  }

  function closeForm() {
    setShowForm(false)
    setEditingClass(null)
    setForm(emptyForm)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      setSaving(true)
      clearMessages()

      if (!form.classCode.trim() || !form.className.trim()) {
        setError('Vui lĂ²ng nháº­p mĂ£ lá»›p vĂ  tĂªn lá»›p')
        return
      }

      const payload = {
        classCode: form.classCode.trim().toUpperCase(),
        className: form.className.trim(),
        department: form.department.trim(),
        academicYear: form.academicYear.trim()
      }

      if (editingClass) {
        await updateClassApi(editingClass.Id, payload)
        setSuccess('Cáº­p nháº­t lá»›p há»c thĂ nh cĂ´ng')
      } else {
        await createClassApi(payload)
        setSuccess('ThĂªm lá»›p há»c thĂ nh cĂ´ng')
      }

      closeForm()
      await loadClasses()
    } catch (err) {
      setError(err.message || 'LÆ°u lá»›p há»c tháº¥t báº¡i')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleLock(classItem) {
    try {
      clearMessages()

      if (classItem.IsActive === false) {
        await unlockClassApi(classItem.Id)
        setSuccess('Má»Ÿ khĂ³a lá»›p há»c thĂ nh cĂ´ng')
      } else {
        await lockClassApi(classItem.Id)
        setSuccess('KhĂ³a lá»›p há»c thĂ nh cĂ´ng')
      }

      await loadClasses()
    } catch (err) {
      setError(err.message || 'KhĂ´ng thá»ƒ cáº­p nháº­t tráº¡ng thĂ¡i lá»›p há»c')
    }
  }

  async function handleOpenStudents(classItem) {
    setSelectedClass(classItem)
    setSelectedStudentId('')
    setStudentSearch('')
    setStudentPage(1)

    await loadClassStudents(classItem, {
      page: 1,
      search: ''
    })

    await loadUsers()
  }

  function closeStudentsPanel() {
    setSelectedClass(null)
    setStudents([])
    setSelectedStudentId('')
    setStudentSearch('')
    setStudentPage(1)
    setStudentPagination({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1
    })
  }

  async function handleSearchStudents(e) {
    e.preventDefault()

    if (!selectedClass) return

    setStudentPage(1)

    await loadClassStudents(selectedClass, {
      page: 1,
      search: studentSearch
    })
  }

  async function handleResetStudentSearch() {
    if (!selectedClass) return

    setStudentSearch('')
    setStudentPage(1)

    await loadClassStudents(selectedClass, {
      page: 1,
      search: ''
    })
  }

  async function handleStudentPageChange(nextPage) {
    if (!selectedClass) return

    if (nextPage < 1 || nextPage > studentPagination.totalPages) {
      return
    }

    setStudentPage(nextPage)

    await loadClassStudents(selectedClass, {
      page: nextPage,
      search: studentSearch
    })
  }

  async function handleAddStudentToClass() {
    try {
      clearMessages()

      if (!selectedClass) {
        setError('Vui lĂ²ng chá»n lá»›p')
        return
      }

      if (!selectedStudentId) {
        setError('Vui lĂ²ng chá»n sinh viĂªn cáº§n thĂªm vĂ o lá»›p')
        return
      }

      await addClassStudentApi(selectedClass.Id, Number(selectedStudentId))

      setSuccess('ThĂªm sinh viĂªn vĂ o lá»›p thĂ nh cĂ´ng')
      setSelectedStudentId('')

      await loadClassStudents(selectedClass, {
        page: studentPage,
        search: studentSearch
      })

      await loadClasses()
      await loadUsers()
    } catch (err) {
      setError(err.message || 'KhĂ´ng thá»ƒ thĂªm sinh viĂªn vĂ o lá»›p')
    }
  }

  async function handleRemoveStudentFromClass(student) {
    try {
      clearMessages()

      const ok = window.confirm(
        `Báº¡n cĂ³ cháº¯c muá»‘n xĂ³a ${student.FullName || student.Email} khá»i lá»›p nĂ y?`
      )

      if (!ok) return

      const studentId = student.StudentId || student.Id || student.UserId

      await removeClassStudentApi(selectedClass.Id, studentId)

      setSuccess('XĂ³a sinh viĂªn khá»i lá»›p thĂ nh cĂ´ng')

      await loadClassStudents(selectedClass, {
        page: studentPage,
        search: studentSearch
      })

      await loadClasses()
      await loadUsers()
    } catch (err) {
      setError(err.message || 'KhĂ´ng thá»ƒ xĂ³a sinh viĂªn khá»i lá»›p')
    }
  }

  function getStatusText(classItem) {
    return classItem.IsActive === false ? 'ÄĂ£ khĂ³a' : 'Hoáº¡t Ä‘á»™ng'
  }

  function getStatusClass(classItem) {
    return classItem.IsActive === false ? 'badge' : 'badge green'
  }

  const departmentOptions = useMemo(() => {
    return [
      ...new Set(classes.map((item) => item.Department).filter(Boolean))
    ]
  }, [classes])

  const academicYearOptions = useMemo(() => {
    return [
      ...new Set(classes.map((item) => item.AcademicYear).filter(Boolean))
    ]
  }, [classes])

  const filteredClasses = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase()

    return classes.filter((item) => {
      const classCode = String(item.ClassCode || '').toLowerCase()
      const className = String(item.ClassName || '').toLowerCase()
      const department = String(item.Department || '')
      const academicYear = String(item.AcademicYear || '')

      const matchKeyword =
        !keyword ||
        classCode.includes(keyword) ||
        className.includes(keyword) ||
        department.toLowerCase().includes(keyword) ||
        academicYear.toLowerCase().includes(keyword)

      const matchDepartment =
        !filters.department || department === filters.department

      const matchAcademicYear =
        !filters.academicYear || academicYear === filters.academicYear

      const matchStatus =
        !filters.status ||
        (filters.status === 'active' && item.IsActive !== false) ||
        (filters.status === 'inactive' && item.IsActive === false)

      return (
        matchKeyword &&
        matchDepartment &&
        matchAcademicYear &&
        matchStatus
      )
    })
  }, [classes, filters])

  const selectedStudentIds = useMemo(() => {
    return new Set(
      students
        .map((student) => student.StudentId || student.Id || student.UserId)
        .filter(Boolean)
    )
  }, [students])

  const availableStudents = useMemo(() => {
    return users.filter((user) => {
      if (normalizeRole(user.Role) !== USER_ROLES.STUDENT) return false
      if (user.IsActive === false) return false

      const hasActiveClass =
        !!user.ActiveClassId ||
        !!user.ActiveClassCode ||
        !!user.ActiveClassName

      if (hasActiveClass) return false

      return !selectedStudentIds.has(user.Id)
    })
  }, [users, selectedStudentIds])

  return (
    <div>
      <div className="page-title row-between">
        <div>
          <h2>Quáº£n lĂ½ lá»›p há»c</h2>
          <p>
            Admin quáº£n lĂ½ danh sĂ¡ch lá»›p vĂ  sinh viĂªn thuá»™c tá»«ng lá»›p.
          </p>
        </div>

        <button className="btn-primary small" onClick={openCreateForm}>
          ThĂªm lá»›p há»c
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      {showForm && (
        <div className="panel">
          <h3>{editingClass ? 'Sá»­a lá»›p há»c' : 'ThĂªm lá»›p há»c'}</h3>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>MĂ£ lá»›p</label>
                <input
                  name="classCode"
                  value={form.classCode}
                  onChange={handleFormChange}
                  placeholder="VĂ­ dá»¥: DA22TTB"
                />
              </div>

              <div className="form-group">
                <label>TĂªn lá»›p</label>
                <input
                  name="className"
                  value={form.className}
                  onChange={handleFormChange}
                  placeholder="VĂ­ dá»¥: Äáº¡i há»c CĂ´ng nghá»‡ thĂ´ng tin B khĂ³a 2022"
                />
              </div>

              <div className="form-group">
                <label>Khoa</label>
                <input
                  name="department"
                  value={form.department}
                  onChange={handleFormChange}
                  placeholder="VĂ­ dá»¥: Khoa Ká»¹ thuáº­t vĂ  CĂ´ng nghá»‡"
                />
              </div>

              <div className="form-group">
                <label>NiĂªn khĂ³a</label>
                <input
                  name="academicYear"
                  value={form.academicYear}
                  onChange={handleFormChange}
                  placeholder="VĂ­ dá»¥: 2022 - 2026"
                />
              </div>
            </div>

            <div className="card-actions">
              <button
                className="btn-primary small"
                type="submit"
                disabled={saving}
              >
                {saving ? 'Äang lÆ°u...' : 'LÆ°u'}
              </button>

              <button className="btn-light" type="button" onClick={closeForm}>
                Há»§y
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="panel">
        <h3>Bá»™ lá»c lá»›p há»c</h3>

        <div className="filter-grid class-filter-grid">
          <div className="form-group">
            <label>TĂ¬m kiáº¿m</label>
            <input
              name="keyword"
              value={filters.keyword}
              onChange={handleFilterChange}
              placeholder="MĂ£ lá»›p, tĂªn lá»›p, khoa, niĂªn khĂ³a..."
            />
          </div>

          <div className="form-group">
            <label>Khoa</label>
            <select
              name="department"
              value={filters.department}
              onChange={handleFilterChange}
            >
              <option value="">Táº¥t cáº£ khoa</option>
              {departmentOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>NiĂªn khĂ³a</label>
            <select
              name="academicYear"
              value={filters.academicYear}
              onChange={handleFilterChange}
            >
              <option value="">Táº¥t cáº£ niĂªn khĂ³a</option>
              {academicYearOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Tráº¡ng thĂ¡i</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">Táº¥t cáº£ tráº¡ng thĂ¡i</option>
              <option value="active">Hoáº¡t Ä‘á»™ng</option>
              <option value="inactive">ÄĂ£ khĂ³a</option>
            </select>
          </div>

          <div className="filter-actions">
            <button className="btn-light" onClick={resetFilters}>
              XĂ³a bá»™ lá»c
            </button>
          </div>
        </div>

        <p className="filter-summary">
          Hiá»ƒn thá»‹ {filteredClasses.length} / {classes.length} lá»›p há»c
        </p>
      </div>

      <div className="panel">
        {loading ? (
          <p>Äang táº£i dá»¯ liá»‡u...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>MĂ£ lá»›p</th>
                <th>TĂªn lá»›p</th>
                <th>Khoa</th>
                <th>NiĂªn khĂ³a</th>
                <th>Sá»‘ SV</th>
                <th>Tráº¡ng thĂ¡i</th>
                <th>NgĂ y táº¡o</th>
                <th>Thao tĂ¡c</th>
              </tr>
            </thead>

            <tbody>
              {filteredClasses.map((classItem) => (
                <tr key={classItem.Id}>
                  <td>{classItem.ClassCode || '-'}</td>
                  <td>{classItem.ClassName || '-'}</td>
                  <td>{classItem.Department || '-'}</td>
                  <td>{classItem.AcademicYear || '-'}</td>
                  <td>{classItem.TotalStudents || 0}</td>

                  <td>
                    <span className={getStatusClass(classItem)}>
                      {getStatusText(classItem)}
                    </span>
                  </td>

                  <td>
                    {classItem.CreatedAt
                      ? new Date(classItem.CreatedAt).toLocaleDateString('vi-VN')
                      : '-'}
                  </td>

                  <td>
                    <button
                      className="btn-light"
                      onClick={() => openEditForm(classItem)}
                    >
                      Sá»­a
                    </button>

                    <button
                      className="btn-light"
                      onClick={() => handleOpenStudents(classItem)}
                    >
                      Xem SV
                    </button>

                    <button
                      className="btn-danger"
                      onClick={() => handleToggleLock(classItem)}
                    >
                      {classItem.IsActive === false ? 'Má»Ÿ khĂ³a' : 'KhĂ³a'}
                    </button>
                  </td>
                </tr>
              ))}

              {filteredClasses.length === 0 && (
                <tr>
                  <td colSpan="8">KhĂ´ng tĂ¬m tháº¥y lá»›p há»c phĂ¹ há»£p.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedClass && (
        <div className="panel">
          <div className="row-between">
            <div>
              <h3>Sinh viĂªn lá»›p {selectedClass.ClassCode}</h3>
              <p>
                {selectedClass.ClassName} - Tá»•ng sá»‘:{' '}
                <strong>{studentPagination.total || 0}</strong> sinh viĂªn
              </p>
            </div>

            <button className="btn-light" onClick={closeStudentsPanel}>
              ÄĂ³ng
            </button>
          </div>

          <form className="student-search-row" onSubmit={handleSearchStudents}>
            <div className="form-group">
              <label>TĂ¬m sinh viĂªn trong lá»›p</label>
              <input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Nháº­p há» tĂªn, email, MSSV hoáº·c sá»‘ Ä‘iá»‡n thoáº¡i..."
              />
            </div>

            <button className="btn-primary small" type="submit">
              TĂ¬m kiáº¿m
            </button>

            <button
              className="btn-light"
              type="button"
              onClick={handleResetStudentSearch}
            >
              XĂ³a tĂ¬m
            </button>
          </form>

          <div className="student-add-row">
            <div className="form-group">
              <label>ThĂªm sinh viĂªn vĂ o lá»›p</label>

              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                <option value="">Chá»n sinh viĂªn chÆ°a thuá»™c lá»›p nĂ o</option>

                {availableStudents.map((student) => (
                  <option key={student.Id} value={student.Id}>
                    {student.FullName} - {student.UserCode || student.Email}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn-primary small" onClick={handleAddStudentToClass}>
              ThĂªm vĂ o lá»›p
            </button>
          </div>

          {availableStudents.length === 0 && (
            <p className="filter-summary">
              KhĂ´ng cĂ²n sinh viĂªn nĂ o chÆ°a thuá»™c lá»›p Ä‘á»ƒ thĂªm.
            </p>
          )}

          {studentLoading ? (
            <p>Äang táº£i danh sĂ¡ch sinh viĂªn...</p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Há» tĂªn</th>
                    <th>Email</th>
                    <th>MSSV</th>
                    <th>Sá»‘ Ä‘iá»‡n thoáº¡i</th>
                    <th>Khoa</th>
                    <th>NgĂ y vĂ o lá»›p</th>
                    <th>Thao tĂ¡c</th>
                  </tr>
                </thead>

                <tbody>
                  {students.map((student) => (
                    <tr key={student.MemberId || student.StudentId}>
                      <td>{student.FullName || '-'}</td>
                      <td>{student.Email || '-'}</td>
                      <td>{student.UserCode || '-'}</td>
                      <td>{student.Phone || '-'}</td>
                      <td>{student.Department || '-'}</td>
                      <td>
                        {student.JoinedAt
                          ? new Date(student.JoinedAt).toLocaleDateString('vi-VN')
                          : '-'}
                      </td>
                      <td>
                        <button
                          className="btn-danger"
                          onClick={() => handleRemoveStudentFromClass(student)}
                        >
                          XĂ³a khá»i lá»›p
                        </button>
                      </td>
                    </tr>
                  ))}

                  {students.length === 0 && (
                    <tr>
                      <td colSpan="7">KhĂ´ng tĂ¬m tháº¥y sinh viĂªn phĂ¹ há»£p.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="pagination-bar">
                <button
                  className="btn-light"
                  disabled={studentPagination.page <= 1}
                  onClick={() =>
                    handleStudentPageChange(studentPagination.page - 1)
                  }
                >
                  TrÆ°á»›c
                </button>

                <span>
                  Trang {studentPagination.page || 1} /{' '}
                  {studentPagination.totalPages || 1}
                </span>

                <button
                  className="btn-light"
                  disabled={
                    studentPagination.page >= studentPagination.totalPages
                  }
                  onClick={() =>
                    handleStudentPageChange(studentPagination.page + 1)
                  }
                >
                  Sau
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default ClassesPage
