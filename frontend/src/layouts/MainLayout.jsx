import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, LayoutDashboard, LogOut, Menu, PanelLeftClose, PanelLeftOpen, School, UserRound, Users, X } from 'lucide-react'
import { USER_ROLES } from '../constants/roles'
import { clearAuth, getUser, getUserRole } from '../utils/auth'

function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getUser()
  const role = getUserRole()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    function closeMenu(event) {
      if (!userMenuRef.current?.contains(event.target)) setUserOpen(false)
    }
    document.addEventListener('mousedown', closeMenu)
    return () => document.removeEventListener('mousedown', closeMenu)
  }, [])

  function handleLogout() { clearAuth(); navigate('/login') }
  function getHomePath() {
    if (role === USER_ROLES.ADMIN) return '/dashboard'
    if (role === USER_ROLES.LECTURER) return '/teacher/dashboard'
    if (role === USER_ROLES.STUDENT) return '/student/dashboard'
    return '/login'
  }
  function getWorkspaceText() {
    if (role === USER_ROLES.ADMIN) return 'Quản trị viên'
    if (role === USER_ROLES.LECTURER) return 'Giảng viên'
    if (role === USER_ROLES.STUDENT) return 'Sinh viên'
    return 'Người dùng'
  }

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: [USER_ROLES.ADMIN] },
    { label: 'Người dùng', icon: Users, path: '/admin/users', roles: [USER_ROLES.ADMIN] },
    { label: 'Lớp học', icon: School, path: '/classes', roles: [USER_ROLES.ADMIN] },
    { label: 'Dashboard', icon: LayoutDashboard, path: '/teacher/dashboard', roles: [USER_ROLES.LECTURER] },
    { label: 'Đề tài của tôi', path: '/teacher/projects', roles: [USER_ROLES.LECTURER] },
    { label: 'Duyệt đăng ký', path: '/teacher/registrations', roles: [USER_ROLES.LECTURER] },
    { label: 'Tiến độ sinh viên', path: '/teacher/progress', roles: [USER_ROLES.LECTURER] },
    { label: 'Bài nộp cuối kỳ', path: '/teacher/final-submissions', roles: [USER_ROLES.LECTURER] },
    { label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard', roles: [USER_ROLES.STUDENT] },
    { label: 'Danh sách đề tài', path: '/student/projects', roles: [USER_ROLES.STUDENT] },
    { label: 'Dự án của tôi', path: '/student/my-project', roles: [USER_ROLES.STUDENT] },
    { label: 'Nộp tiến độ', path: '/student/progress', roles: [USER_ROLES.STUDENT] },
    { label: 'Nộp cuối kỳ', path: '/student/final-submissions', roles: [USER_ROLES.STUDENT] },
    { label: 'Hồ sơ', icon: UserRound, path: '/profile', roles: [USER_ROLES.ADMIN, USER_ROLES.LECTURER, USER_ROLES.STUDENT] }
  ]
  const visibleMenus = menuItems.filter((item) => item.roles.includes(role))
  const displayName = user?.fullName || user?.FullName || 'Người dùng'

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {mobileOpen && <button className="sidebar-overlay" aria-label="Đóng menu" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="brand">
          <button className="brand-home" onClick={() => navigate(getHomePath())} aria-label="Về trang chủ">
            <div className="brand-logo">TVU</div>
            <div className="brand-text"><h2>Project Portal</h2><p>Quản lý đồ án sinh viên</p></div>
          </button>
          <button className="mobile-close" aria-label="Đóng menu" onClick={() => setMobileOpen(false)}><X size={20} /></button>
        </div>
        <nav className="menu" aria-label="Điều hướng chính">
          <p className="menu-label">Điều hướng</p>
          {visibleMenus.map((item) => {
            const Icon = item.icon || UserRound
            return <NavLink key={`${item.path}-${item.label}`} to={item.path} onClick={() => setMobileOpen(false)} title={collapsed ? item.label : undefined} className={({ isActive }) => isActive ? 'menu-link active' : 'menu-link'}><Icon size={20} /><span>{item.label}</span></NavLink>
          })}
        </nav>
        <div className="sidebar-role"><span>Vai trò hiện tại</span><strong>{getWorkspaceText()}</strong></div>
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}>{collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}<span>Thu gọn menu</span></button>
      </aside>

      <div className="main-area">
        <header className="header">
          <button className="menu-toggle" aria-label="Mở menu" onClick={() => setMobileOpen(true)}><Menu size={22} /></button>
          <div className="header-title"><p>Cổng quản lý đồ án sinh viên</p><h1>{visibleMenus.find((item) => item.path === location.pathname)?.label || 'Không gian làm việc'}</h1></div>
          <div className="header-user">
            <button className="notification-btn" aria-label="Thông báo"><Bell size={20} /></button>
            <div className="user-menu" ref={userMenuRef}>
              <button className="user-trigger" onClick={() => setUserOpen(!userOpen)} aria-expanded={userOpen}>
                <div className="avatar">{displayName.charAt(0).toUpperCase()}</div>
                <div className="user-info"><strong>{displayName}</strong><span>{getWorkspaceText()}</span></div><ChevronDown size={16} />
              </button>
              {userOpen && <div className="user-dropdown"><button onClick={() => navigate('/profile')}><UserRound size={17} /> Hồ sơ cá nhân</button><button className="danger-item" onClick={handleLogout}><LogOut size={17} /> Đăng xuất</button></div>}
            </div>
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  )
}

export default MainLayout
