import { useEffect, useMemo, useState } from 'react'
import {
  createUser,
  getUserById,
  getUsers,
  resetUserPassword,
  updateUser,
  updateUserStatus
} from '../api/adminApi'
import { USER_ROLES } from '../constants/roles'

const emptyForm = {
  fullName: '',
  email: '',
  role: USER_ROLES.STUDENT,
  userCode: '',
  phone: '',
  department: '',
  className: '',
  password: '',
  confirmPassword: ''
}

const emptyResetForm = {
  newPassword: '',
  confirmNewPassword: ''
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('vi-VN') : '-'
}

function getRoleText(role) {
  if (role === USER_ROLES.ADMIN) return 'Admin'
  if (role === USER_ROLES.LECTURER) return 'Giảng viên'
  if (role === USER_ROLES.STUDENT) return 'Sinh viên'
  return role || '-'
}

function getStatusText(isActive) {
  return isActive === false ? 'Đã khóa' : 'Hoạt động'
}

function getStatusClass(isActive) {
  return isActive === false ? 'badge' : 'badge green'
}

function getUserId(user) {
  return user?.id || user?.Id
}

function UsersPage() {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0
  })
  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 10,
    search: '',
    role: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [mode, setMode] = useState('list')
  const [selectedUser, setSelectedUser] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [resetForm, setResetForm] = useState(emptyResetForm)

  useEffect(() => {
    loadUsers(filters)
  }, [])

  const canGoPrevious = pagination.page > 1
  const canGoNext = pagination.page < pagination.totalPages

  const formTitle = useMemo(() => {
    if (mode === 'create') return 'Tạo tài khoản'
    if (mode === 'edit') return 'Cập nhật tài khoản'
    if (mode === 'detail') return 'Chi tiết tài khoản'
    if (mode === 'reset') return 'Reset mật khẩu'
    return ''
  }, [mode])

  async function loadUsers(nextFilters = filters) {
    try {
      setLoading(true)
      setError('')

      const response = await getUsers(nextFilters)
      const data = response?.data || {}

      setUsers(Array.isArray(data.items) ? data.items : [])
      setPagination({
        page: data.page || nextFilters.page || 1,
        pageSize: data.pageSize || nextFilters.pageSize || 10,
        totalItems: data.totalItems || 0,
        totalPages: data.totalPages || 0
      })
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }

  function clearMessages() {
    setError('')
    setSuccess('')
  }

  function updateFilters(patch) {
    const nextFilters = {
      ...filters,
      ...patch
    }

    setFilters(nextFilters)
    return nextFilters
  }

  async function handleSearch(e) {
    e.preventDefault()
    const nextFilters = updateFilters({ page: 1 })
    await loadUsers(nextFilters)
  }

  async function handleFilterChange(e) {
    const { name, value } = e.target
    const nextFilters = updateFilters({ [name]: value, page: 1 })
    await loadUsers(nextFilters)
  }

  async function handlePageChange(page) {
    if (page < 1 || (pagination.totalPages && page > pagination.totalPages)) return

    const nextFilters = updateFilters({ page })
    await loadUsers(nextFilters)
  }

  function handleFormChange(e) {
    const { name, value } = e.target
    setForm({
      ...form,
      [name]: value
    })
  }

  function handleResetFormChange(e) {
    const { name, value } = e.target
    setResetForm({
      ...resetForm,
      [name]: value
    })
  }

  function openCreateForm() {
    clearMessages()
    setSelectedUser(null)
    setForm(emptyForm)
    setMode('create')
  }

  async function openDetail(user) {
    try {
      clearMessages()
      setSaving(true)
      const response = await getUserById(getUserId(user))
      setSelectedUser(response?.data || user)
      setMode('detail')
    } catch (err) {
      setError(err.message || 'Không thể tải chi tiết người dùng')
    } finally {
      setSaving(false)
    }
  }

  function openEditForm(user) {
    clearMessages()
    setSelectedUser(user)
    setForm({
      fullName: user.fullName || '',
      email: user.email || '',
      role: user.role || USER_ROLES.STUDENT,
      userCode: user.userCode || '',
      phone: user.phone || '',
      department: user.department || '',
      className: user.className || '',
      password: '',
      confirmPassword: ''
    })
    setMode('edit')
  }

  function openResetPassword(user) {
    clearMessages()
    setSelectedUser(user)
    setResetForm(emptyResetForm)
    setMode('reset')
  }

  function closePanel() {
    setMode('list')
    setSelectedUser(null)
    setForm(emptyForm)
    setResetForm(emptyResetForm)
  }

  function validateCreateForm() {
    if (!form.fullName.trim()) return 'Vui lòng nhập họ tên.'
    if (!form.email.trim()) return 'Vui lòng nhập email.'
    if (!form.role) return 'Vui lòng chọn vai trò.'
    if (mode === 'create' && !form.password) return 'Vui lòng nhập mật khẩu ban đầu.'
    if (mode === 'create' && form.password !== form.confirmPassword) return 'Xác nhận mật khẩu không khớp.'
    if (form.role === USER_ROLES.STUDENT && !form.className.trim()) return 'Sinh viên cần có mã lớp.'
    if ((form.role === USER_ROLES.STUDENT || form.role === USER_ROLES.LECTURER) && !form.userCode.trim()) {
      return form.role === USER_ROLES.STUDENT ? 'Vui lòng nhập MSSV.' : 'Vui lòng nhập mã giảng viên.'
    }

    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    clearMessages()

    const validationMessage = validateCreateForm()
    if (validationMessage) {
      setError(validationMessage)
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

    try {
      setSaving(true)

      if (mode === 'create') {
        await createUser({
          ...payload,
          password: form.password,
          confirmPassword: form.confirmPassword
        })
        setSuccess('Tạo người dùng thành công')
      } else {
        await updateUser(getUserId(selectedUser), payload)
        setSuccess('Cập nhật người dùng thành công')
      }

      closePanel()
      await loadUsers(filters)
    } catch (err) {
      setError(err.message || 'Không thể lưu người dùng')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusToggle(user) {
    const nextIsActive = user.isActive === false
    const actionText = nextIsActive ? 'mở khóa' : 'khóa'

    if (!window.confirm(`Bạn có chắc muốn ${actionText} tài khoản ${user.fullName || user.email}?`)) {
      return
    }

    try {
      clearMessages()
      setSaving(true)
      await updateUserStatus(getUserId(user), nextIsActive)
      setSuccess(nextIsActive ? 'Mở khóa tài khoản thành công' : 'Khóa tài khoản thành công')
      await loadUsers(filters)
    } catch (err) {
      setError(err.message || 'Không thể cập nhật trạng thái tài khoản')
    } finally {
      setSaving(false)
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    clearMessages()

    if (!resetForm.newPassword) {
      setError('Vui lòng nhập mật khẩu mới.')
      return
    }

    if (resetForm.newPassword !== resetForm.confirmNewPassword) {
      setError('Xác nhận mật khẩu mới không khớp.')
      return
    }

    try {
      setSaving(true)
      await resetUserPassword(getUserId(selectedUser), resetForm)
      setSuccess('Reset mật khẩu thành công')
      closePanel()
    } catch (err) {
      setError(err.message || 'Không thể reset mật khẩu')
    } finally {
      setSaving(false)
    }
  }

  function renderUserPanel() {
    if (mode === 'list') return null

    if (mode === 'detail') {
      const user = selectedUser || {}

      return (
        <div className="panel">
          <div className="row-between">
            <h3>{formTitle}</h3>
            <button className="btn-light" onClick={closePanel}>Đóng</button>
          </div>

          <div className="info-list">
            <div><span>Mã</span><strong>{user.userCode || '-'}</strong></div>
            <div><span>Họ tên</span><strong>{user.fullName || '-'}</strong></div>
            <div><span>Email</span><strong>{user.email || '-'}</strong></div>
            <div><span>Vai trò</span><strong>{getRoleText(user.role)}</strong></div>
            <div><span>Trạng thái</span><strong>{getStatusText(user.isActive)}</strong></div>
            <div><span>Số điện thoại</span><strong>{user.phone || '-'}</strong></div>
            <div><span>Khoa</span><strong>{user.department || '-'}</strong></div>
            <div><span>Lớp</span><strong>{user.className || '-'}</strong></div>
            <div><span>Ngày tạo</span><strong>{formatDate(user.createdAt)}</strong></div>
          </div>
        </div>
      )
    }

    if (mode === 'reset') {
      return (
        <div className="panel">
          <div className="row-between">
            <h3>{formTitle}</h3>
            <button className="btn-light" onClick={closePanel}>Đóng</button>
          </div>

          <form onSubmit={handleResetPassword}>
            <div className="form-grid">
              <div className="form-group">
                <label>Mật khẩu mới</label>
                <input
                  name="newPassword"
                  type="password"
                  value={resetForm.newPassword}
                  onChange={handleResetFormChange}
                  placeholder="Tối thiểu 8 ký tự"
                />
              </div>

              <div className="form-group">
                <label>Xác nhận mật khẩu mới</label>
                <input
                  name="confirmNewPassword"
                  type="password"
                  value={resetForm.confirmNewPassword}
                  onChange={handleResetFormChange}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
            </div>

            <button className="btn-primary small" type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Reset mật khẩu'}
            </button>
          </form>
        </div>
      )
    }

    return (
      <div className="panel">
        <div className="row-between">
          <h3>{formTitle}</h3>
          <button className="btn-light" onClick={closePanel}>Đóng</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Họ tên</label>
              <input name="fullName" value={form.fullName} onChange={handleFormChange} />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" value={form.email} onChange={handleFormChange} />
            </div>

            <div className="form-group">
              <label>Vai trò</label>
              <select name="role" value={form.role} onChange={handleFormChange}>
                {mode === 'edit' && selectedUser?.role === USER_ROLES.ADMIN && (
                  <option value={USER_ROLES.ADMIN}>Admin</option>
                )}
                <option value={USER_ROLES.LECTURER}>Giảng viên</option>
                <option value={USER_ROLES.STUDENT}>Sinh viên</option>
              </select>
            </div>

            <div className="form-group">
              <label>MSSV / Mã giảng viên</label>
              <input name="userCode" value={form.userCode} onChange={handleFormChange} />
            </div>

            <div className="form-group">
              <label>Số điện thoại</label>
              <input name="phone" value={form.phone} onChange={handleFormChange} />
            </div>

            <div className="form-group">
              <label>Khoa</label>
              <input name="department" value={form.department} onChange={handleFormChange} />
            </div>

            <div className="form-group">
              <label>Lớp</label>
              <input name="className" value={form.className} onChange={handleFormChange} />
            </div>

            {mode === 'create' && (
              <>
                <div className="form-group">
                  <label>Mật khẩu ban đầu</label>
                  <input name="password" type="password" value={form.password} onChange={handleFormChange} />
                </div>

                <div className="form-group">
                  <label>Xác nhận mật khẩu</label>
                  <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleFormChange} />
                </div>
              </>
            )}
          </div>

          <button className="btn-primary small" type="submit" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <div className="page-title row-between">
        <div>
          <h2>Quản lý người dùng</h2>
          <p>Admin quản lý tài khoản giảng viên và sinh viên trong hệ thống.</p>
        </div>

        <button className="btn-primary small" onClick={openCreateForm}>
          Tạo tài khoản
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      {renderUserPanel()}

      <div className="panel">
        <form className="filter-grid" onSubmit={handleSearch}>
          <div className="form-group">
            <label>Tìm kiếm</label>
            <input
              name="search"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Họ tên, email, mã, khoa, lớp..."
            />
          </div>

          <div className="form-group">
            <label>Vai trò</label>
            <select name="role" value={filters.role} onChange={handleFilterChange}>
              <option value="">Tất cả</option>
              <option value={USER_ROLES.ADMIN}>Admin</option>
              <option value={USER_ROLES.LECTURER}>Giảng viên</option>
              <option value={USER_ROLES.STUDENT}>Sinh viên</option>
            </select>
          </div>

          <div className="form-group">
            <label>Trạng thái</label>
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">Tất cả</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Đã khóa</option>
            </select>
          </div>

          <div className="form-group">
            <label>Sắp xếp</label>
            <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
              <option value="createdAt">Ngày tạo</option>
              <option value="fullName">Họ tên</option>
              <option value="email">Email</option>
              <option value="role">Vai trò</option>
              <option value="status">Trạng thái</option>
            </select>
          </div>

          <div className="form-group">
            <label>Thứ tự</label>
            <select name="sortOrder" value={filters.sortOrder} onChange={handleFilterChange}>
              <option value="desc">Giảm dần</option>
              <option value="asc">Tăng dần</option>
            </select>
          </div>

          <div className="filter-actions">
            <button className="btn-light" type="submit">Tìm</button>
          </div>
        </form>
      </div>

      <div className="panel">
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={getUserId(user)}>
                    <td>{user.userCode || '-'}</td>
                    <td>{user.fullName || '-'}</td>
                    <td>{user.email || '-'}</td>
                    <td><span className="badge blue">{getRoleText(user.role)}</span></td>
                    <td><span className={getStatusClass(user.isActive)}>{getStatusText(user.isActive)}</span></td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <button className="btn-light" onClick={() => openDetail(user)}>Xem</button>
                      <button className="btn-light" onClick={() => openEditForm(user)}>Sửa</button>
                      <button className="btn-light" onClick={() => openResetPassword(user)}>Reset MK</button>
                      <button className="btn-danger" onClick={() => handleStatusToggle(user)}>
                        {user.isActive === false ? 'Mở khóa' : 'Khóa'}
                      </button>
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td colSpan="7">Không có người dùng phù hợp.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="row-between pagination-row">
              <span>
                Trang {pagination.page} / {pagination.totalPages || 1} - Tổng {pagination.totalItems} người dùng
              </span>

              <div className="card-actions">
                <button className="btn-light" disabled={!canGoPrevious} onClick={() => handlePageChange(pagination.page - 1)}>
                  Trước
                </button>
                <button className="btn-light" disabled={!canGoNext} onClick={() => handlePageChange(pagination.page + 1)}>
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default UsersPage
