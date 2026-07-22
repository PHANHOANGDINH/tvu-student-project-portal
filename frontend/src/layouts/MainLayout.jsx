import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BarChart3, BookOpen, ChevronDown, FileText, GraduationCap, KeyRound, Layers3, LogOut, Menu, School, User, UserPlus, Users, X } from 'lucide-react'
import { USER_ROLES } from '../constants/roles'
import { clearAuth, getUser, getUserRole } from '../utils/auth'
import NotificationBell from '../components/NotificationBell'

const roleText = { ADMIN: 'Quản trị viên', LECTURER: 'Giảng viên', STUDENT: 'Sinh viên' }
const adminSections = [
  { title: 'Tổng quan', items: [{ label: 'Tổng quan', path: '/admin/dashboard', icon: BarChart3 }] },
  { title: 'Quản lý người dùng', items: [{ label: 'Danh sách tài khoản', path: '/admin/users', icon: Users }, { label: 'Thêm tài khoản', path: '/admin/users/new', icon: UserPlus }, { label: 'Nhập sinh viên', path: '/admin/students/import', icon: FileText }, { label: 'Nhập giảng viên', path: '/admin/lecturers/import', icon: GraduationCap }] },
  { title: 'Quản lý học vụ', items: [{ label: 'Năm học', path: '/admin/academic-years', icon: Layers3 }, { label: 'Học kỳ', path: '/admin/semesters', icon: BookOpen }, { label: 'Môn học', path: '/admin/subjects', icon: School }, { label: 'Lớp học phần', path: '/admin/course-classes', icon: GraduationCap }] },
  { title: 'Hệ thống', items: [{ label: 'Hồ sơ cá nhân', path: '/profile', icon: User }, { label: 'Đổi mật khẩu', path: '/profile', icon: KeyRound }] },
]
const lecturerMain = [
  ['Trang chủ', '/lecturer/dashboard'], ['Bảng điều khiển', '/lecturer/dashboard'], ['Lớp phụ trách', '/lecturer/course-classes'], ['Nhóm & Đề tài', '/lecturer/groups'], ['Bài nộp', '/lecturer/submissions'], ['Chấm điểm', '/lecturer/submissions'],
]
const studentMain = [
  ['Trang chủ', '/student/dashboard'], ['Bảng điều khiển', '/student/dashboard'], ['Các lớp học của tôi', '/student/course-classes'], ['Nhóm của tôi', '/student/groups/my-group'], ['Bài nộp', '/student/submissions'], ['Kết quả', '/student/submissions'],
]
const extras = {
  LECTURER: [['Yêu cầu nộp', '/lecturer/submission-requirements'], ['Đề tài chờ duyệt', '/lecturer/topic-registrations']],
  STUDENT: [['Đề tài', '/student/topic-registration'], ['Yêu cầu nộp', '/student/submission-requirements']],
}

function AccountMenu({ name, role, logout }) {
  const [open, setOpen] = useState(false)
  return <div className="account-menu">
    <button className="account-trigger" onClick={() => setOpen(!open)} aria-expanded={open}>
      <span className="lms-avatar">{name.charAt(0).toUpperCase()}</span><span className="account-copy"><strong>{name}</strong><small>{roleText[role]}</small></span><ChevronDown size={16}/>
    </button>
    {open && <div className="account-dropdown">
      <NavLink to="/profile" onClick={() => setOpen(false)}><User size={17}/> Hồ sơ</NavLink>
      <NavLink to="/profile" onClick={() => setOpen(false)}><KeyRound size={17}/> Đổi mật khẩu</NavLink>
      <button onClick={logout}><LogOut size={17}/> Đăng xuất</button>
    </div>}
  </div>
}

function LmsLayout({ role, name, logout }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const main = role === USER_ROLES.LECTURER ? lecturerMain : studentMain
  return <div className="lms-shell">
    <header className="lms-topbar">
      <div className="lms-topbar-inner">
        <button className="lms-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Mở menu">{mobileOpen ? <X/> : <Menu/>}</button>
        <NavLink className="lms-brand" to={main[0][1]}><span>TVU</span><div><strong>Student Project Portal</strong><small>Cổng học tập và dự án</small></div></NavLink>
        <nav className={`lms-nav ${mobileOpen ? 'open' : ''}`}>
          {main.map(([label, path], index) => <NavLink key={`${label}-${index}`} to={path} onClick={() => setMobileOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>{label}</NavLink>)}
          <div className="more-nav"><button onClick={() => setMoreOpen(!moreOpen)}>Xem thêm <ChevronDown size={15}/></button>{moreOpen && <div className="more-dropdown">{extras[role].map(([label,path])=><NavLink key={label} to={path} onClick={()=>{setMoreOpen(false);setMobileOpen(false)}}>{label}</NavLink>)}<NavLink to="/profile">Thông báo</NavLink><NavLink to="/profile">Hồ sơ</NavLink></div>}</div>
        </nav>
        <div className="lms-user-actions"><NotificationBell role={role}/><AccountMenu name={name} role={role} logout={logout}/></div>
      </div>
    </header>
    <main className="lms-content"><Outlet/></main>
  </div>
}

function AdminLayout({ name, role, logout }) {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const link = item => { const Icon = item.icon; return <NavLink key={`${item.path}-${item.label}`} to={item.path} onClick={()=>setMobileOpen(false)} className={({isActive})=>isActive?'menu-link active':'menu-link'}><Icon size={18}/><span>{item.label}</span></NavLink> }
  return <div className="app-shell admin-modern-shell"><aside className={`sidebar ${mobileOpen?'open':''}`}><div className="brand" onClick={()=>navigate('/admin/dashboard')}><div className="brand-logo">TVU</div><div className="brand-text"><h2>Cổng dự án</h2><p>Trường Đại học Trà Vinh</p></div><button className="mobile-close" onClick={e=>{e.stopPropagation();setMobileOpen(false)}}><X/></button></div><nav className="menu">{adminSections.map(section=><section className="menu-section" key={section.title}><p>{section.title}</p>{section.items.map(link)}</section>)}</nav></aside>{mobileOpen&&<button className="sidebar-backdrop" onClick={()=>setMobileOpen(false)}/>}<div className="main-area"><header className="header"><div className="header-leading"><button className="mobile-menu" onClick={()=>setMobileOpen(true)}><Menu/></button><div><h1>Khu vực quản trị</h1><div className="breadcrumbs"><span>Trang chủ</span></div></div></div><div className="header-user"><NotificationBell role={role}/><div className="avatar">{name.charAt(0).toUpperCase()}</div><div className="user-info"><strong>{name}</strong><span>{roleText[role]}</span></div><button className="logout-btn" onClick={logout}><LogOut size={17}/><span>Đăng xuất</span></button></div></header><main className="content"><Outlet/></main></div></div>
}

export default function MainLayout() {
  const navigate = useNavigate(), user = getUser(), role = getUserRole()
  const name = user?.fullName || user?.FullName || user?.email || user?.Email || 'Người dùng'
  const logout = () => { clearAuth(); navigate('/login') }
  return role === USER_ROLES.ADMIN ? <AdminLayout name={name} role={role} logout={logout}/> : <LmsLayout name={name} role={role} logout={logout}/>
}
