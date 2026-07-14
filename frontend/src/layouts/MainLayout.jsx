import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { USER_ROLES } from '../constants/roles'
import { clearAuth, getUser, getUserRole } from '../utils/auth'

function MainLayout() {
  const navigate = useNavigate()
  const user = getUser()
  const role = getUserRole()

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  function getHomePath() {
    if (role === USER_ROLES.ADMIN) return '/dashboard'
    if (role === USER_ROLES.LECTURER) return '/teacher/dashboard'
    if (role === USER_ROLES.STUDENT) return '/student/dashboard'

    return '/login'
  }

  function getWorkspaceText() {
    if (role === USER_ROLES.ADMIN) return 'Khu vực quản trị hệ thống'
    if (role === USER_ROLES.LECTURER) return 'Khu vực giảng viên'
    if (role === USER_ROLES.STUDENT) return 'Khu vực sinh viên'

    return 'TVU Student Project Portal'
  }

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', roles: [USER_ROLES.ADMIN] },
    { label: 'Người dùng', path: '/admin/users', roles: [USER_ROLES.ADMIN] },
    { label: 'Lớp học', path: '/classes', roles: [USER_ROLES.ADMIN] },
    { label: 'Dashboard', path: '/teacher/dashboard', roles: [USER_ROLES.LECTURER] },
    { label: 'Đề tài của tôi', path: '/teacher/projects', roles: [USER_ROLES.LECTURER] },
    { label: 'Duyệt đăng ký', path: '/teacher/registrations', roles: [USER_ROLES.LECTURER] },
    { label: 'Tiến độ sinh viên', path: '/teacher/progress', roles: [USER_ROLES.LECTURER] },
    { label: 'Bài nộp cuối kỳ', path: '/teacher/final-submissions', roles: [USER_ROLES.LECTURER] },
    { label: 'Dashboard', path: '/student/dashboard', roles: [USER_ROLES.STUDENT] },
    { label: 'Danh sách đề tài', path: '/student/projects', roles: [USER_ROLES.STUDENT] },
    { label: 'Dự án của tôi', path: '/student/my-project', roles: [USER_ROLES.STUDENT] },
    { label: 'Nộp tiến độ', path: '/student/progress', roles: [USER_ROLES.STUDENT] },
    { label: 'Nộp cuối kỳ', path: '/student/final-submissions', roles: [USER_ROLES.STUDENT] },
    { label: 'Hồ sơ', path: '/profile', roles: [USER_ROLES.ADMIN, USER_ROLES.LECTURER, USER_ROLES.STUDENT] }
  ]

  const visibleMenus = menuItems.filter((item) => item.roles.includes(role))

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand" onClick={() => navigate(getHomePath())}>
          <div className="brand-logo">TVU</div>

          <div className="brand-text">
            <h2>Project Portal</h2>
            <p>Quản lý dự án sinh viên</p>
          </div>
        </div>

        <nav className="menu">
          {visibleMenus.map((item) => (
            <NavLink
              key={`${item.path}-${item.label}`}
              to={item.path}
              className={({ isActive }) =>
                isActive ? 'menu-link active' : 'menu-link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main-area">
        <header className="header">
          <div className="header-title">
            <h1>Cổng quản lý dự án sinh viên</h1>
            <p>{getWorkspaceText()}</p>
          </div>

          <div className="header-user">
            <div className="avatar">
              {(user?.fullName || user?.FullName || user?.email || user?.Email || 'U')
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="user-info">
              <strong>{user?.fullName || user?.FullName || 'Người dùng'}</strong>
              <span>{role}</span>
            </div>

            <button className="logout-btn" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
