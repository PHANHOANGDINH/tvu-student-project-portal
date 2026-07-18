import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { USER_ROLES } from '../constants/roles'
import { clearAuth, getUser, getUserRole } from '../utils/auth'
import NotificationBell from '../components/NotificationBell'

function MainLayout() {
  const navigate = useNavigate()
  const user = getUser()
  const role = getUserRole()

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  function getHomePath() {
    if (role === USER_ROLES.ADMIN) return '/admin/dashboard'
    if (role === USER_ROLES.LECTURER) return '/lecturer/dashboard'
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
    { label: 'Dashboard', path: '/admin/dashboard', roles: [USER_ROLES.ADMIN] },
    { label: 'Người dùng', path: '/admin/users', roles: [USER_ROLES.ADMIN] },
    { label: 'Năm học', path: '/admin/academic-years', roles: [USER_ROLES.ADMIN] },
    { label: 'Học kỳ', path: '/admin/semesters', roles: [USER_ROLES.ADMIN] },
    { label: 'Môn học', path: '/admin/subjects', roles: [USER_ROLES.ADMIN] },
    { label: 'Lớp học phần', path: '/admin/course-classes', roles: [USER_ROLES.ADMIN] },
    { label: 'Dashboard', path: '/lecturer/dashboard', roles: [USER_ROLES.LECTURER] },
    { label: 'Nhóm sinh viên', path: '/lecturer/groups', roles: [USER_ROLES.LECTURER] },
    { label: 'Duyệt đề tài nhóm', path: '/lecturer/topic-registrations', roles: [USER_ROLES.LECTURER] },
    { label: 'Đợt nộp bài', path: '/lecturer/submission-requirements', roles: [USER_ROLES.LECTURER] },
    { label: 'Bài nộp sinh viên', path: '/lecturer/submissions', roles: [USER_ROLES.LECTURER] },
    { label: 'Dashboard', path: '/student/dashboard', roles: [USER_ROLES.STUDENT] },
    { label: 'Lớp đang tham gia', path: '/student/course-classes', roles: [USER_ROLES.STUDENT] },
    { label: 'Nhóm của tôi', path: '/student/groups/my-group', roles: [USER_ROLES.STUDENT] },
    { label: 'Đăng ký đề tài', path: '/student/topic-registration', roles: [USER_ROLES.STUDENT] },
    { label: 'Yêu cầu nộp bài', path: '/student/submission-requirements', roles: [USER_ROLES.STUDENT] },
    { label: 'Bài nộp của nhóm', path: '/student/submissions', roles: [USER_ROLES.STUDENT] },
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
            <NotificationBell role={role} />
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
