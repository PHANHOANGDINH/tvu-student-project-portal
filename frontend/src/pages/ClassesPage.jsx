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
      setError(err.message || 'Không thể tải dữ liệu lớp học')
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
      setError(err.message || 'Không thể tải danh sách lớp học')
    }
  }

  async function loadUsers() {
    try {
      const response = await getUsersApi()
      const list = response?.data || []

      setUsers(Array.isArray(list) ? list : [])
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách người dùng')
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
      setError(err.message || 'Không thể tải danh sách sinh viên của lớp')
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
        setError('Vui lòng nhập mã lớp và tên lớp')
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
        setSuccess('Cập nhật lớp học thành công')
      } else {
        await createClassApi(payload)
        setSuccess('Thêm lớp học thành công')
      }

      closeForm()
      await loadClasses()
    } catch (err) {
      setError(err.message || 'Lưu lớp học thất bại')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleLock(classItem) {
    try {
      clearMessages()

      if (classItem.IsActive === false) {
        await unlockClassApi(classItem.Id)
        setSuccess('Mở khóa lớp học thành công')
      } else {
        await lockClassApi(classItem.Id)
        setSuccess('Khóa lớp học thành công')
      }

      await loadClasses()
    } catch (err) {
      setError(err.message || 'Không thể cập nhật trạng thái lớp học')
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
        setError('Vui lòng chọn lớp')
        return
      }

      if (!selectedStudentId) {
        setError('Vui lòng chọn sinh viên cần thêm vào lớp')
        return
      }

      await addClassStudentApi(selectedClass.Id, Number(selectedStudentId))

      setSuccess('Thêm sinh viên vào lớp thành công')
      setSelectedStudentId('')

      await loadClassStudents(selectedClass, {
        page: studentPage,
        search: studentSearch
      })

      await loadClasses()
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Không thể thêm sinh viên vào lớp')
    }
  }

  async function handleRemoveStudentFromClass(student) {
    try {
      clearMessages()

      const ok = window.confirm(
        `Bạn có chắc muốn xóa ${student.FullName || student.Email} khỏi lớp này?`
      )

      if (!ok) return

      const studentId = student.StudentId || student.Id || student.UserId

      await removeClassStudentApi(selectedClass.Id, studentId)

      setSuccess('Xóa sinh viên khỏi lớp thành công')

      await loadClassStudents(selectedClass, {
        page: studentPage,
        search: studentSearch
      })

      await loadClasses()
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Không thể xóa sinh viên khỏi lớp')
    }
  }

  function getStatusText(classItem) {
    return classItem.IsActive === false ? 'Đã khóa' : 'Hoạt động'
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
          <h2>Quản lý lớp học</h2>
          <p>
            Admin quản lý danh sách lớp và sinh viên thuộc từng lớp.
          </p>
        </div>

        <button className="btn-primary small" onClick={openCreateForm}>
          Thêm lớp học
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      {showForm && (
        <div className="panel">
          <h3>{editingClass ? 'Sửa lớp học' : 'Thêm lớp học'}</h3>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Mã lớp</label>
                <input
                  name="classCode"
                  value={form.classCode}
                  onChange={handleFormChange}
                  placeholder="Ví dụ: DA22TTB"
                />
              </div>

              <div className="form-group">
                <label>Tên lớp</label>
                <input
                  name="className"
                  value={form.className}
                  onChange={handleFormChange}
                  placeholder="Ví dụ: Đại học Công nghệ thông tin B khóa 2022"
                />
              </div>

              <div className="form-group">
                <label>Khoa</label>
                <input
                  name="department"
                  value={form.department}
                  onChange={handleFormChange}
                  placeholder="Ví dụ: Khoa Kỹ thuật và Công nghệ"
                />
              </div>

              <div className="form-group">
                <label>Niên khóa</label>
                <input
                  name="academicYear"
                  value={form.academicYear}
                  onChange={handleFormChange}
                  placeholder="Ví dụ: 2022 - 2026"
                />
              </div>
            </div>

            <div className="card-actions">
              <button
                className="btn-primary small"
                type="submit"
                disabled={saving}
              >
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>

              <button className="btn-light" type="button" onClick={closeForm}>
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="panel">
        <h3>Bộ lọc lớp học</h3>

        <div className="filter-grid class-filter-grid">
          <div className="form-group">
            <label>Tìm kiếm</label>
            <input
              name="keyword"
              value={filters.keyword}
              onChange={handleFilterChange}
              placeholder="Mã lớp, tên lớp, khoa, niên khóa..."
            />
          </div>

          <div className="form-group">
            <label>Khoa</label>
            <select
              name="department"
              value={filters.department}
              onChange={handleFilterChange}
            >
              <option value="">Tất cả khoa</option>
              {departmentOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Niên khóa</label>
            <select
              name="academicYear"
              value={filters.academicYear}
              onChange={handleFilterChange}
            >
              <option value="">Tất cả niên khóa</option>
              {academicYearOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Trạng thái</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Đã khóa</option>
            </select>
          </div>

          <div className="filter-actions">
            <button className="btn-light" onClick={resetFilters}>
              Xóa bộ lọc
            </button>
          </div>
        </div>

        <p className="filter-summary">
          Hiển thị {filteredClasses.length} / {classes.length} lớp học
        </p>
      </div>

      <div className="panel">
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Mã lớp</th>
                <th>Tên lớp</th>
                <th>Khoa</th>
                <th>Niên khóa</th>
                <th>Số SV</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
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
                      Sửa
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
                      {classItem.IsActive === false ? 'Mở khóa' : 'Khóa'}
                    </button>
                  </td>
                </tr>
              ))}

              {filteredClasses.length === 0 && (
                <tr>
                  <td colSpan="8">Không tìm thấy lớp học phù hợp.</td>
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
              <h3>Sinh viên lớp {selectedClass.ClassCode}</h3>
              <p>
                {selectedClass.ClassName} - Tổng số:{' '}
                <strong>{studentPagination.total || 0}</strong> sinh viên
              </p>
            </div>

            <button className="btn-light" onClick={closeStudentsPanel}>
              Đóng
            </button>
          </div>

          <form className="student-search-row" onSubmit={handleSearchStudents}>
            <div className="form-group">
              <label>Tìm sinh viên trong lớp</label>
              <input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Nhập họ tên, email, MSSV hoặc số điện thoại..."
              />
            </div>

            <button className="btn-primary small" type="submit">
              Tìm kiếm
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
              <label>Thêm sinh viên vào lớp</label>

              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                <option value="">Chọn sinh viên chưa thuộc lớp nào</option>

                {availableStudents.map((student) => (
                  <option key={student.Id} value={student.Id}>
                    {student.FullName} - {student.UserCode || student.Email}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn-primary small" onClick={handleAddStudentToClass}>
              Thêm vào lớp
            </button>
          </div>

          {availableStudents.length === 0 && (
            <p className="filter-summary">
              Không còn sinh viên nào chưa thuộc lớp để thêm.
            </p>
          )}

          {studentLoading ? (
            <p>Đang tải danh sách sinh viên...</p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Họ tên</th>
                    <th>Email</th>
                    <th>MSSV</th>
                    <th>Số điện thoại</th>
                    <th>Khoa</th>
                    <th>Ngày vào lớp</th>
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
                          Xóa khỏi lớp
                        </button>
                      </td>
                    </tr>
                  ))}

                  {students.length === 0 && (
                    <tr>
                      <td colSpan="7">Không tìm thấy sinh viên phù hợp.</td>
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
                  Trước
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
