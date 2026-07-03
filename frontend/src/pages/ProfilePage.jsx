import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserDetailApi } from '../api/adminApi'
import { clearAuth, getUser } from '../utils/auth'

function ProfilePage() {
  const navigate = useNavigate()
  const currentUser = getUser()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      setLoading(true)
      setError('')

      const userId = currentUser?.id || currentUser?.Id

      if (!userId) {
        setProfile(currentUser)
        return
      }

      const response = await getUserDetailApi(userId)
      setProfile(response?.data || currentUser)
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

  function getRoleText(role) {
    switch (role) {
      case 'Admin':
        return 'Quản trị viên'
      case 'Teacher':
        return 'Giảng viên'
      case 'Student':
        return 'Sinh viên'
      default:
        return role || '-'
    }
  }

  function getStatusText(isActive) {
    return isActive === false ? 'Đã khóa' : 'Hoạt động'
  }

  function getStatusClass(isActive) {
    return isActive === false ? 'badge' : 'badge green'
  }

  const fullName = profile?.FullName || profile?.fullName || 'Người dùng'
  const email = profile?.Email || profile?.email || '-'
  const role = profile?.Role || profile?.role || '-'
  const userCode = profile?.UserCode || profile?.userCode || '-'
  const phone = profile?.Phone || profile?.phone || '-'
  const department = profile?.Department || profile?.department || '-'
  const className = profile?.ClassName || profile?.className || '-'
  const isActive = profile?.IsActive
  const createdAt = profile?.CreatedAt || profile?.createdAt

  return (
    <div>
      <div className="page-title row-between">
        <div>
          <h2>Hồ sơ cá nhân</h2>
          <p>Thông tin tài khoản Admin đang đăng nhập.</p>
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
              <h3>Thao tác nhanh</h3>

              <div className="quick-actions">
                <button
                  className="btn-primary small"
                  onClick={() => navigate('/dashboard')}
                >
                  Xem Dashboard
                </button>

                <button
                  className="btn-light"
                  onClick={() => navigate('/users')}
                >
                  Quản lý người dùng
                </button>

                <button
                  className="btn-light"
                  onClick={() => navigate('/classes')}
                >
                  Quản lý lớp học
                </button>
              </div>

              <div className="profile-note">
                <h4>Ghi chú</h4>
                <p>
                  Tài khoản Admin dùng để quản trị hệ thống, quản lý người dùng,
                  lớp học, tài khoản sinh viên và giảng viên.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ProfilePage