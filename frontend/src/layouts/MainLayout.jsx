import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileCheck2,
  FileUp,
  FolderKanban,
  GraduationCap,
  Layers3,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  School,
  UserPlus,
  UserRound,
  Users,
  X
} from 'lucide-react'
import { USER_ROLES } from '../constants/roles'
import { clearAuth, getUser, getUserRole } from '../utils/auth'
import NotificationBell from '../components/NotificationBell'

const roleText = {
  ADMIN: 'Quản trị viên',
  LECTURER: 'Giảng viên',
  STUDENT: 'Sinh viên'
}

const breadcrumbLabels = {
  admin: 'Quản trị',
  dashboard: 'Tổng quan',
  users: 'Tài khoản',
  new: 'Thêm mới',
  students: 'Sinh viên',
  lecturers: 'Giảng viên',
  import: 'Nhập danh sách',
  'academic-years': 'Năm học',
  semesters: 'Học kỳ',
  subjects: 'Môn học',
  'course-classes': 'Lớp học phần',
  profile: 'Hồ sơ',
  teacher: 'Giảng viên',
  student: 'Sinh viên',
  groups: 'Nhóm sinh viên',
  'topic-registrations': 'Duyệt đề tài',
  'submission-requirements': 'Đợt nộp bài',
  submissions: 'Bài nộp',
  progress: 'Báo cáo tiến độ',
  'final-submissions': 'Bài nộp cuối kỳ',
  notifications: 'Thông báo'
}

export default function MainLayout() {
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
    return roleText[role] || 'Người dùng'
  }

  // Khai báo danh mục Menu đẩy đủ hỗ trợ cả Admin, Lecturer và Student
  const menuItems = [
    // Admin
    { label: 'Tổng quan', icon: BarChart3, path: '/admin/dashboard', roles: [USER_ROLES.ADMIN] },
    { label: 'Danh sách tài khoản', icon: Users, path: '/admin/users', roles: [USER_ROLES.ADMIN] },
    { label: 'Thêm tài khoản', icon: UserPlus, path: '/admin/users/new', roles: [USER_ROLES.ADMIN] },
    { label: 'Nhập sinh viên', icon: FileUp, path: '/admin/students/import', roles: [USER_ROLES.ADMIN] },
    { label: 'Nhập giảng viên', icon: GraduationCap, path: '/admin/lecturers/import', roles: [USER_ROLES.ADMIN] },
    { label: 'Năm học', icon: Layers3, path: '/admin/academic-years', roles: [USER_ROLES.ADMIN] },
    { label: 'Học kỳ', icon: BookOpen, path: '/admin/semesters', roles: [USER_ROLES.ADMIN] },
    { label: 'Môn học', icon: School, path: '/admin/subjects', roles: [USER_ROLES.ADMIN] },
    { label: 'Lớp học phần', icon: GraduationCap, path: '/admin/course-classes', roles: [USER_ROLES.ADMIN] },

    // Lecturer
    { label: 'Tổng quan', icon: LayoutDashboard, path: '/lecturer/dashboard', roles: [USER_ROLES.LECTURER] },
    { label: 'Nhóm sinh viên', icon: Users, path: '/lecturer/groups', roles: [USER_ROLES.LECTURER] },
    { label: 'Duyệt đề tài nhóm', icon: FolderKanban, path: '/lecturer/topic-registrations', roles: [USER_ROLES.LECTURER] },
    { label: 'Đợt nộp bài', icon: BookOpen, path: '/lecturer/submission-requirements', roles: [USER_ROLES.LECTURER] },
    { label: 'Bài nộp sinh viên', icon: FileCheck2, path: '/lecturer/submissions', roles: [USER_ROLES.LECTURER] },

    // Student
    { label: 'Tổng quan', icon: LayoutDashboard, path: '/student/dashboard', roles: [USER_ROLES.STUDENT] },
    { label: 'Lớp đang tham gia', icon: School, path: '/student/course-classes', roles: [USER_ROLES.STUDENT] },
    { label: 'Nhóm của tôi', icon: Users, path: '/student/groups/my-group', roles: [USER_ROLES.STUDENT] },
    { label: 'Đăng ký đề tài', icon: FolderKanban, path: '/student/topic-registration', roles: [USER_ROLES.STUDENT] },
    { label: 'Yêu cầu nộp bài', icon: BookOpen, path: '/student/submission-requirements', roles: [USER_ROLES.STUDENT] },
    { label: 'Báo cáo tiến độ', icon: BookOpen, path: '/student/progress', roles: [USER_ROLES.STUDENT] },
    { label: 'Bài cuối kỳ', icon: FileCheck2, path: '/student/final-submissions', roles: [USER_ROLES.STUDENT] },
    { label: 'Thông báo', icon: Bell, path: '/student/notifications', roles: [USER_ROLES.STUDENT] },

    // Shared
    { label: 'Hồ sơ cá nhân', icon: UserRound, path: '/profile', roles: [USER_ROLES.ADMIN, USER_ROLES.LECTURER, USER_ROLES.STUDENT] }
  ]

  const visibleMenus = menuItems.filter((item) => item.roles.includes(role))
  const displayName = user?.fullName || user?.FullName || user?.email || user?.Email || 'Người dùng'

  // Breadcrumbs
  const breadcrumbs = location.pathname
    .split('/')
    .filter(Boolean)
    .map((part, index, all) => ({
      label: breadcrumbLabels[part] || part,
      path: '/' + all.slice(0, index + 1).join('/')
    }))

  const activeMenu = visibleMenus.find((item) => item.path === location.pathname)

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Đóng menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="brand">
          <button
            className="brand-home"
            onClick={() => navigate(getHomePath())}
            aria-label="Về trang chủ"
          >
            <div className="brand-logo">TVU</div>
            <div className="brand-text">
              <h2>Project Portal</h2>
              <p>Quản lý đồ án sinh viên</p>
            </div>
          </button>
          <button
            className="mobile-close"
            aria-label="Đóng menu"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="menu" aria-label="Điều hướng chính">
          <p className="menu-label">Điều hướng</p>
          {visibleMenus.map((item) => {
            const Icon = item.icon || UserRound
            return (
              <NavLink
                key={`${item.path}-${item.label}`}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) => (isActive ? 'menu-link active' : 'menu-link')}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-role">
          <span>Vai trò hiện tại</span>
          <strong>{getWorkspaceText()}</strong>
        </div>

        <button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
          <span>Thu gọn menu</span>
        </button>
      </aside>

      {/* Main Area */}
      <div className="main-area">
        <header className="header">
          <div className="header-leading">
            <button
              className="menu-toggle"
              aria-label="Mở menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div className="header-title">
              <p>Cổng quản lý đồ án sinh viên</p>
              <h1>{activeMenu ? activeMenu.label : 'Khu vực làm việc'}</h1>
              {breadcrumbs.length > 0 && (
                <div className="breadcrumbs">
                  <span>Trang chủ</span>
                  {breadcrumbs.map((item) => (
                    <span key={item.path}>
                      <ChevronRight size={13} />
                      {item.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="header-user">
            {/* Component Thông báo */}
            <NotificationBell role={role} />

            {/* Menu người dùng Dropdown */}
            <div className="user-menu" ref={userMenuRef}>
              <button
                className="user-trigger"
                onClick={() => setUserOpen(!userOpen)}
                aria-expanded={userOpen}
              >
                <div className="avatar">{displayName.charAt(0).toUpperCase()}</div>
                <div className="user-info">
                  <strong>{displayName}</strong>
                  <span>{getWorkspaceText()}</span>
                </div>
                <ChevronDown size={16} />
              </button>

              {userOpen && (
                <div className="user-dropdown">
                  <button onClick={() => { setUserOpen(false); navigate('/profile'); }}>
                    <UserRound size={17} /> Hồ sơ cá nhân
                  </button>
                  <button className="danger-item" onClick={handleLogout}>
                    <LogOut size={17} /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
