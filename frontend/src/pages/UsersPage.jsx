import { useEffect, useMemo, useState } from 'react'
import {
  createUserApi,
  getUsersApi,
  importUsersExcelApi,
  lockUserApi,
  resetUserPasswordApi,
  unlockUserApi,
  updateUserApi
} from '../api/adminApi'

const emptyForm = {
  fullName: '',
  email: '',
  password: '',
  role: 'Student',
  userCode: '',
  phone: '',
  department: '',
  className: ''
}

function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [importResult, setImportResult] = useState(null)
  const [importType, setImportType] = useState('students')

  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const [filters, setFilters] = useState({
    keyword: '',
    role: '',
    status: '',
    className: '',
    department: ''
  })

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      setLoading(true)
      setError('')

      const response = await getUsersApi()
      const list = response?.data || []

      setUsers(Array.isArray(list) ? list : [])
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }

  function clearMessages() {
    setError('')
    setSuccess('')
    setResetPassword('')
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
      role: '',
      status: '',
      className: '',
      department: ''
    })
  }

  function openCreateForm() {
    setEditingUser(null)
    setForm(emptyForm)
    setShowForm(true)
    setImportResult(null)
    clearMessages()
  }

  function openEditForm(user) {
    setEditingUser(user)

    setForm({
      fullName: user.FullName || '',
      email: user.Email || '',
      password: '',
      role: user.Role || 'Student',
      userCode: user.UserCode || '',
      phone: user.Phone || '',
      department: user.Department || '',
      className: user.ClassName || ''
    })

    setShowForm(true)
    setImportResult(null)
    clearMessages()
  }

  function closeForm() {
    setShowForm(false)
    setEditingUser(null)
    setForm(emptyForm)
  }

  function handleFormChange(e) {
    const { name, value } = e.target

    setForm({
      ...form,
      [name]: value
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      setSaving(true)
      clearMessages()

      if (!form.fullName.trim() || !form.email.trim() || !form.role) {
        setError('Vui lòng nhập họ tên, email và vai trò')
        return
      }

      if (!editingUser && !form.password.trim()) {
        setError('Vui lòng nhập mật khẩu cho tài khoản mới')
        return
      }

      if (!editingUser && form.password.trim().length < 6) {
        setError('Mật khẩu phải có ít nhất 6 ký tự')
        return
      }

      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        role: form.role,
        userCode: form.userCode.trim(),
        phone: form.phone.trim(),
        department: form.department.trim(),
        className: form.className.trim()
      }

      if (editingUser) {
        await updateUserApi(editingUser.Id, payload)
        setSuccess('Cập nhật người dùng thành công')
      } else {
        payload.password = form.password
        await createUserApi(payload)
        setSuccess('Tạo người dùng thành công')
      }

      closeForm()
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Lưu người dùng thất bại')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleLock(user) {
    try {
      clearMessages()
      setImportResult(null)

      if (user.IsActive === false) {
        await unlockUserApi(user.Id)
        setSuccess('Mở khóa tài khoản thành công')
      } else {
        await lockUserApi(user.Id)
        setSuccess('Khóa tài khoản thành công')
      }

      await loadUsers()
    } catch (err) {
      setError(err.message || 'Không thể cập nhật trạng thái tài khoản')
    }
  }

  async function handleResetPassword(user) {
    try {
      clearMessages()
      setImportResult(null)

      const ok = window.confirm(
        `Bạn có chắc muốn cấp lại mật khẩu cho ${user.FullName || user.Email}?`
      )

      if (!ok) return

      const response = await resetUserPasswordApi(user.Id)

      setSuccess('Cấp lại mật khẩu thành công')
      setResetPassword(response?.newPassword || '')
    } catch (err) {
      setError(err.message || 'Không thể cấp lại mật khẩu')
    }
  }

  async function handleImportExcel(e) {
    try {
      const file = e.target.files?.[0]

      if (!file) return

      clearMessages()
      setImportResult(null)
      setSaving(true)

      const response = await importUsersExcelApi(file, importType)

      setImportResult(response)
      setSuccess('Import Excel hoàn tất')

      await loadUsers()
    } catch (err) {
      setError(err.message || 'Import Excel thất bại')
    } finally {
      setSaving(false)
      e.target.value = ''
    }
  }

  function getImportTypeText(type) {
    if (type === 'students') {
      return 'Danh sách sinh viên'
    }

    if (type === 'teachers') {
      return 'Danh sách giảng viên'
    }

    return '-'
  }

  function getStatusText(user) {
    return user.IsActive === false ? 'Đã khóa' : 'Hoạt động'
  }

  function getStatusClass(user) {
    return user.IsActive === false ? 'badge' : 'badge green'
  }

  function getRoleText(role) {
    switch (role) {
      case 'Admin':
        return 'Admin'
      case 'Teacher':
        return 'Giảng viên'
      case 'Student':
        return 'Sinh viên'
      default:
        return role || '-'
    }
  }

  const classOptions = useMemo(() => {
    return [...new Set(users.map((user) => user.ClassName).filter(Boolean))]
  }, [users])

  const departmentOptions = useMemo(() => {
    return [...new Set(users.map((user) => user.Department).filter(Boolean))]
  }, [users])

  const filteredUsers = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase()

    return users.filter((user) => {
      const fullName = String(user.FullName || '').toLowerCase()
      const email = String(user.Email || '').toLowerCase()
      const userCode = String(user.UserCode || '').toLowerCase()
      const phone = String(user.Phone || '').toLowerCase()
      const className = String(user.ClassName || '')
      const department = String(user.Department || '')
      const role = String(user.Role || '')

      const matchKeyword =
        !keyword ||
        fullName.includes(keyword) ||
        email.includes(keyword) ||
        userCode.includes(keyword) ||
        phone.includes(keyword) ||
        className.toLowerCase().includes(keyword) ||
        department.toLowerCase().includes(keyword)

      const matchRole = !filters.role || role === filters.role

      const matchStatus =
        !filters.status ||
        (filters.status === 'active' && user.IsActive !== false) ||
        (filters.status === 'inactive' && user.IsActive === false)

      const matchClass =
        !filters.className || className === filters.className

      const matchDepartment =
        !filters.department || department === filters.department

      return (
        matchKeyword &&
        matchRole &&
        matchStatus &&
        matchClass &&
        matchDepartment
      )
    })
  }, [users, filters])

  return (
    <div>
      <div className="page-title row-between">
        <div>
          <h2>Quản lý người dùng</h2>
          <p>
            Admin quản lý tài khoản sinh viên, giảng viên và quản trị viên.
          </p>
        </div>

        <div className="card-actions">
          <select
            value={importType}
            onChange={(e) => setImportType(e.target.value)}
            className="import-select"
            disabled={saving}
          >
            <option value="students">Import danh sách sinh viên</option>
            <option value="teachers">Import danh sách giảng viên</option>
          </select>

          <label className="btn-light import-label">
            {saving ? 'Đang xử lý...' : 'Chọn file Excel'}
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              style={{ display: 'none' }}
              disabled={saving}
            />
          </label>

          <button className="btn-primary small" onClick={openCreateForm}>
            Thêm người dùng
          </button>
        </div>
      </div>

      <div className="panel">
        <h3>Hướng dẫn import Excel</h3>

        {importType === 'students' ? (
          <p>
            File sinh viên cần các cột: <strong>Họ tên, Email, MSSV, Số điện thoại, Khoa, Mã lớp, Mật khẩu</strong>.
            Mật khẩu có thể để trống, hệ thống sẽ dùng mặc định <strong>123456</strong>.
          </p>
        ) : (
          <p>
            File giảng viên cần các cột: <strong>Họ tên, Email, Mã giảng viên, Số điện thoại, Khoa, Mật khẩu</strong>.
            Mật khẩu có thể để trống, hệ thống sẽ dùng mặc định <strong>123456</strong>.
          </p>
        )}
      </div>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      {resetPassword && (
        <div className="alert success">
          Mật khẩu mới: <strong>{resetPassword}</strong>
        </div>
      )}

      {importResult && (
        <div className="panel">
          <h3>Kết quả import Excel</h3>

          <p>
            Loại import: <strong>{getImportTypeText(importResult.importType)}</strong>
          </p>

          <div className="stat-grid">
            <div className="stat-card">
              <span>Tổng dòng</span>
              <strong>{importResult.totalRows || 0}</strong>
            </div>

            <div className="stat-card">
              <span>Thành công</span>
              <strong>{importResult.successCount || 0}</strong>
            </div>

            <div className="stat-card">
              <span>Thất bại</span>
              <strong>{importResult.failedCount || 0}</strong>
            </div>
          </div>

          {importResult.errorItems?.length > 0 && (
            <>
              <h4>Danh sách dòng lỗi</h4>

              <table>
                <thead>
                  <tr>
                    <th>Dòng</th>
                    <th>Email</th>
                    <th>Lý do lỗi</th>
                  </tr>
                </thead>

                <tbody>
                  {importResult.errorItems.map((item) => (
                    <tr key={`${item.row}-${item.email}-${item.reason}`}>
                      <td>{item.row}</td>
                      <td>{item.email || '-'}</td>
                      <td>{item.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {showForm && (
        <div className="panel">
          <h3>{editingUser ? 'Sửa người dùng' : 'Thêm người dùng'}</h3>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Họ tên</label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleFormChange}
                  placeholder="Nhập họ tên"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleFormChange}
                  placeholder="Nhập email"
                />
              </div>

              {!editingUser && (
                <div className="form-group">
                  <label>Mật khẩu</label>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleFormChange}
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Vai trò</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleFormChange}
                >
                  <option value="Admin">Admin</option>
                  <option value="Teacher">Giảng viên</option>
                  <option value="Student">Sinh viên</option>
                </select>
              </div>

              <div className="form-group">
                <label>MSSV / Mã giảng viên</label>
                <input
                  name="userCode"
                  value={form.userCode}
                  onChange={handleFormChange}
                  placeholder="Ví dụ: 1101220001 hoặc GV001"
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleFormChange}
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div className="form-group">
                <label>Khoa</label>
                <input
                  name="department"
                  value={form.department}
                  onChange={handleFormChange}
                  placeholder="Nhập khoa"
                />
              </div>

              <div className="form-group">
                <label>Lớp</label>
                <input
                  name="className"
                  value={form.className}
                  onChange={handleFormChange}
                  placeholder="Ví dụ: DA22TTB"
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
        <h3>Bộ lọc người dùng</h3>

        <div className="filter-grid">
          <div className="form-group">
            <label>Tìm kiếm</label>
            <input
              name="keyword"
              value={filters.keyword}
              onChange={handleFilterChange}
              placeholder="Họ tên, email, MSSV, mã GV, SĐT, lớp, khoa..."
            />
          </div>

          <div className="form-group">
            <label>Vai trò</label>
            <select
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
            >
              <option value="">Tất cả vai trò</option>
              <option value="Admin">Admin</option>
              <option value="Teacher">Giảng viên</option>
              <option value="Student">Sinh viên</option>
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

          <div className="form-group">
            <label>Lớp</label>
            <select
              name="className"
              value={filters.className}
              onChange={handleFilterChange}
            >
              <option value="">Tất cả lớp</option>
              {classOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
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

          <div className="filter-actions">
            <button className="btn-light" onClick={resetFilters}>
              Xóa bộ lọc
            </button>
          </div>
        </div>

        <p className="filter-summary">
          Hiển thị {filteredUsers.length} / {users.length} người dùng
        </p>
      </div>

      <div className="panel">
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Mã người dùng</th>
                <th>Số điện thoại</th>
                <th>Khoa</th>
                <th>Lớp</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.Id}>
                  <td>{user.FullName || '-'}</td>
                  <td>{user.Email || '-'}</td>
                  <td>{user.UserCode || '-'}</td>
                  <td>{user.Phone || '-'}</td>
                  <td>{user.Department || '-'}</td>
                  <td>{user.ClassName || '-'}</td>

                  <td>
                    <span className="badge blue">
                      {getRoleText(user.Role)}
                    </span>
                  </td>

                  <td>
                    <span className={getStatusClass(user)}>
                      {getStatusText(user)}
                    </span>
                  </td>

                  <td>
                    {user.CreatedAt
                      ? new Date(user.CreatedAt).toLocaleDateString('vi-VN')
                      : '-'}
                  </td>

                  <td>
                    <button
                      className="btn-light"
                      onClick={() => openEditForm(user)}
                    >
                      Sửa
                    </button>

                    <button
                      className="btn-light"
                      onClick={() => handleResetPassword(user)}
                    >
                      Cấp lại MK
                    </button>

                    <button
                      className="btn-danger"
                      onClick={() => handleToggleLock(user)}
                    >
                      {user.IsActive === false ? 'Mở khóa' : 'Khóa'}
                    </button>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="10">Không tìm thấy người dùng phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default UsersPage