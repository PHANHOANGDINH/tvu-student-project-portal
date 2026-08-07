import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, LogOut, Menu, UserRound } from 'lucide-react'
import NotificationBell from '../NotificationBell'

const labels = { admin: 'Quản trị', lecturer: 'Giảng viên', student: 'Sinh viên', dashboard: 'Tổng quan', users: 'Tài khoản', new: 'Thêm mới', students: 'Sinh viên', lecturers: 'Giảng viên', import: 'Nhập dữ liệu', 'academic-years': 'Năm học', semesters: 'Học kỳ', subjects: 'Môn học', faculties: 'Khoa', 'administrative-classes': 'Lớp hành chính', 'course-classes': 'Lớp học phần', profile: 'Hồ sơ', groups: 'Nhóm', 'topic-registrations': 'Đăng ký đề tài', 'topic-registration': 'Đề tài', 'submission-requirements': 'Yêu cầu nộp bài', submissions: 'Bài nộp', progress: 'Tiến độ', 'final-submissions': 'Bài cuối kỳ', notifications: 'Thông báo' }

export default function AppHeader({ pathname, items, user, role, roleLabel, onMenu, onProfile, onLogout }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  useEffect(() => {
    const close = event => { if (!menuRef.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  const crumbs = pathname.split('/').filter(Boolean).map((part, index, all) => ({ label: labels[part] || part, path: '/' + all.slice(0, index + 1).join('/') }))
  const active = items.find(item => item.path === pathname)
  const name = user?.fullName || user?.FullName || user?.email || user?.Email || 'Người dùng'
  return (
    <header className="header">
      <div className="header-leading">
        <button className="menu-toggle" aria-label="Mở menu" onClick={onMenu}><Menu size={22} /></button>
        <div className="header-title">
          <p>ĐẠI HỌC TRÀ VINH · Cổng quản lý đồ án sinh viên</p>
          <h1>{active?.label || crumbs.at(-1)?.label || 'Khu vực làm việc'}</h1>
          <div className="breadcrumbs" aria-label="Đường dẫn trang"><span>Trang chủ</span>{crumbs.map(item => <span key={item.path}><ChevronRight size={13} />{item.label}</span>)}</div>
        </div>
      </div>
      <div className="header-user">
        <NotificationBell role={role} />
        <div className="user-menu" ref={menuRef}>
          <button className="user-trigger" onClick={() => setOpen(value => !value)} aria-expanded={open}>
            <div className="avatar">{name.charAt(0).toUpperCase()}</div>
            <div className="user-info"><strong>{name}</strong><span>{roleLabel}</span></div><ChevronDown size={16} />
          </button>
          {open && <div className="user-dropdown"><button onClick={() => { setOpen(false); onProfile() }}><UserRound size={17} /> Hồ sơ cá nhân</button><button className="danger-item" onClick={onLogout}><LogOut size={17} /> Đăng xuất</button></div>}
        </div>
      </div>
    </header>
  )
}
