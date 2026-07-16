import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { changePasswordApi, getCurrentUserApi } from '../api/authApi'
import { USER_ROLES } from '../constants/roles'
import { clearAuth, getUser, updateStoredUser } from '../utils/auth'

const emptyPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: ''
}

function ProfilePage() {
  const navigate = useNavigate()
  const currentUser = getUser()

  const [profile, setProfile] = useState(currentUser)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      setLoading(true)
      setError('')

      const response = await getCurrentUserApi()
      setProfile(response?.data || currentUser)
      if (response?.data) updateStoredUser(response.data)
    } catch (err) {
      setError(err.message || 'Không thể tải hồ sơ cá nhân')
      setProfile(currentUser)
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  function handlePasswordChange(e) {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    })
  }

  function validatePasswordForm() {
    if (!passwordForm.currentPassword) return 'Vui lòng nhập mật khẩu hiện tại.'
    if (!passwordForm.newPassword) return 'Vui lòng nhập mật khẩu mới.'
    if (passwordForm.newPassword.length < 8) return 'Mật khẩu mới phải có ít nhất 8 ký tự.'
    if (!/[A-Z]/.test(passwordForm.newPassword)) return 'Mật khẩu mới phải có ít nhất một chữ hoa.'
    if (!/[a-z]/.test(passwordForm.newPassword)) return 'Mật khẩu mới phải có ít nhất một chữ thường.'
    if (!/\d/.test(passwordForm.newPassword)) return 'Mật khẩu mới phải có ít nhất một chữ số.'
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) return 'Xác nhận mật khẩu mới không khớp.'
    if (passwordForm.currentPassword === passwordForm.newPassword) return 'Mật khẩu mới không được giống mật khẩu cũ.'

    return ''
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    const validationMessage = validatePasswordForm()
    if (validationMessage) {
      setPasswordError(validationMessage)
      return
    }

    try {
      setPasswordLoading(true)
      const response = await changePasswordApi(passwordForm)
      setPasswordSuccess(response?.message || 'Đổi mật khẩu thành công')
      setPasswordForm(emptyPasswordForm)
    } catch (err) {
      setPasswordError(err.message || 'Không thể đổi mật khẩu')
    } finally {
      setPasswordLoading(false)
    }
  }

  function getRoleText(role) {
    switch (role) {
      case USER_ROLES.ADMIN:
        return 'Quản trị viên'
      case USER_ROLES.LECTURER:
        return 'Giảng viên'
      case USER_ROLES.STUDENT:
        return 'Sinh viên'
      default:
        return role || '-'
    }
  }

  function getHomePath(role) {
    if (role === USER_ROLES.ADMIN) return '/dashboard'
    if (role === USER_ROLES.LECTURER) return '/teacher/dashboard'
    if (role === USER_ROLES.STUDENT) return '/student/dashboard'

    return '/dashboard'
  }

  function getStatusText(isActive) {
    return isActive === false ? 'Đã khóa' : 'Hoạt động'
  }

  function getStatusClass(isActive) {
    return isActive === false ? 'badge' : 'badge green'
  }

  const fullName = profile?.fullName || profile?.FullName || 'Người dùng'
  const email = profile?.email || profile?.Email || '-'
  const role = profile?.role || profile?.Role || '-'
  const userCode = profile?.userCode || profile?.UserCode || '-'
  const phone = profile?.phone || profile?.Phone || '-'
  const department = profile?.department || profile?.Department || '-'
  const className = profile?.className || profile?.ClassName || '-'
  const isActive = profile?.isActive ?? profile?.IsActive
  const createdAt = profile?.createdAt || profile?.CreatedAt

  return (
    <div>
      <div className="page-title row-between">
        <div>
          <h2>Hồ sơ cá nhân</h2>
          <p>Thông tin tài khoản đang đăng nhập.</p>
        </div>

        <button className="btn-danger" onClick={handleLogout}>
          Đăng xuất
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      {loading ? (
        <div className="panel">
          <p>Đang tải hồ sơ...</p>
        </div>
      ) : (
        <>
          <div className="panel profile-hero">
            <div className="avatar profile-avatar">
              {fullName.charAt(0).toUpperCase()}
            </div>

            <div className="profile-main-info">
              <h3>{fullName}</h3>
              <p>{email}</p>

              <div className="profile-badges">
                <span className="badge blue">{getRoleText(role)}</span>
                <span className={getStatusClass(isActive)}>
                  {getStatusText(isActive)}
                </span>
              </div>
            </div>
          </div>

          <div className="profile-grid">
            <div className="panel">
              <h3>Thông tin tài khoản</h3>

              <div className="info-list">
                <div>
                  <span>Họ tên</span>
                  <strong>{fullName}</strong>
                </div>

                <div>
                  <span>Email</span>
                  <strong>{email}</strong>
                </div>

                <div>
                  <span>Vai trò</span>
                  <strong>{getRoleText(role)}</strong>
                </div>

                <div>
                  <span>Mã người dùng</span>
                  <strong>{userCode}</strong>
                </div>

                <div>
                  <span>Số điện thoại</span>
                  <strong>{phone}</strong>
                </div>

                <div>
                  <span>Khoa</span>
                  <strong>{department}</strong>
                </div>

                <div>
                  <span>Lớp</span>
                  <strong>{className}</strong>
                </div>

                <div>
                  <span>Ngày tạo</span>
                  <strong>
                    {createdAt
                      ? new Date(createdAt).toLocaleDateString('vi-VN')
                      : '-'}
                  </strong>
                </div>
              </div>
            </div>

            <div className="panel">
              <h3>Đổi mật khẩu</h3>

              {passwordError && <div className="alert error">{passwordError}</div>}
              {passwordSuccess && <div className="alert success">{passwordSuccess}</div>}

              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label>Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </div>

                <div className="form-group">
                  <label>Mật khẩu mới</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Tối thiểu 8 ký tự"
                  />
                </div>

                <div className="form-group">
                  <label>Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    name="confirmNewPassword"
                    value={passwordForm.confirmNewPassword}
                    onChange={handlePasswordChange}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>

                <button className="btn-primary" type="submit" disabled={passwordLoading}>
                  {passwordLoading ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
                </button>
              </form>
            </div>
          </div>

          <div className="panel">
            <h3>Thao tác nhanh</h3>

            <div className="quick-actions">
              <button
                className="btn-primary small"
                onClick={() => navigate(getHomePath(role))}
              >
                Xem tổng quan
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ProfilePage
