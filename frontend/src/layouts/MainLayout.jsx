import { NavLink, Outlet, useNavigate } from 'react-router-dom'
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
    if (role === 'Admin') return '/dashboard'
    if (role === 'Teacher') return '/teacher/dashboard'
    if (role === 'Student') return '/student/dashboard'

    return '/login'
  }

  function getWorkspaceText() {
    if (role === 'Admin') return 'Khu vực quản trị hệ thống'
    if (role === 'Teacher') return 'Khu vực giảng viên'
    if (role === 'Student') return 'Khu vực sinh viên'

    return 'TVU Student Project Portal'
  }

  const menuItems = [
    // ADMIN
    {
      label: 'Dashboard',
      path: '/dashboard',
      roles: ['Admin']
    },
    {
      label: 'Người dùng',
      path: '/users',
      roles: ['Admin']
    },
    {
      label: 'Lớp học',
      path: '/classes',
      roles: ['Admin']
    },

    // TEACHER
    {
      label: 'Dashboard',
      path: '/teacher/dashboard',
      roles: ['Teacher']
    },
    {
      label: 'Đề tài của tôi',
      path: '/teacher/projects',
      roles: ['Teacher']
    },
    {
      label: 'Duyệt đăng ký',
      path: '/teacher/registrations',
      roles: ['Teacher']
    },
    {
      label: 'Tiến độ sinh viên',
      path: '/teacher/progress',
      roles: ['Teacher']
    },
    {
      label: 'Bài nộp cuối kỳ',
      path: '/teacher/final-submissions',
      roles: ['Teacher']
    },

    // STUDENT - để sau mình làm tiếp
    {
      label: 'Dashboard',
      path: '/student/dashboard',
      roles: ['Student']
    },
    {
      label: 'Danh sách đề tài',
      path: '/student/projects',
      roles: ['Student']
    },
    {
      label: 'Dự án của tôi',
      path: '/student/my-project',
      roles: ['Student']
    },
    {
      label: 'Nộp tiến độ',
      path: '/student/progress',
      roles: ['Student']
    },
    {
      label: 'Nộp cuối kỳ',
      path: '/student/final-submissions',
      roles: ['Student']
    },

    // CHUNG
    {
      label: 'Hồ sơ',
      path: '/profile',
      roles: ['Admin', 'Teacher', 'Student']
    }
  ]

  const visibleMenus = menuItems.filter((item) => item.roles.includes(role))

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand" onClick={() => navigate(getHomePath())}>
          <div className="brand-logo">TVU</div>

          <div>
            <h2>Project Portal</h2>
            <p>Quản lý dự án sinh viên</p>
          </div>
        </div>

        <nav className="menu">
          {visibleMenus.map((item) => (
            <NavLink key={`${item.path}-${item.label}`} to={item.path}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main-area">
        <header className="header">
          <div>
            <h1>Cổng quản lý dự án sinh viên</h1>
            <p>{getWorkspaceText()}</p>
          </div>

          <div className="header-user">
            <div className="avatar">
              {(user?.fullName || user?.FullName || user?.email || user?.Email || 'U')
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {user?.fullName || user?.FullName || 'Người dùng'}
              </strong>
              <span>{role}</span>
            </div>

            <button onClick={handleLogout}>Đăng xuất</button>
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