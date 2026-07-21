import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BarChart3, BookOpen, ChevronRight, FileUp, GraduationCap, KeyRound, Layers3, LogOut, Menu, School, UserPlus, Users, X } from 'lucide-react'
import { USER_ROLES } from '../constants/roles'
import { clearAuth, getUser, getUserRole } from '../utils/auth'
import NotificationBell from '../components/NotificationBell'

const roleText={ADMIN:'Quản trị viên',LECTURER:'Giảng viên',STUDENT:'Sinh viên'}
const adminSections=[
 {title:'Tổng quan',items:[{label:'Tổng quan',path:'/admin/dashboard',icon:BarChart3}]},
 {title:'Quản lý người dùng',items:[{label:'Danh sách tài khoản',path:'/admin/users',icon:Users},{label:'Thêm tài khoản',path:'/admin/users/new',icon:UserPlus},{label:'Nhập sinh viên',path:'/admin/students/import',icon:FileUp},{label:'Nhập giảng viên',path:'/admin/lecturers/import',icon:GraduationCap}]},
 {title:'Quản lý học vụ',items:[{label:'Năm học',path:'/admin/academic-years',icon:Layers3},{label:'Học kỳ',path:'/admin/semesters',icon:BookOpen},{label:'Môn học',path:'/admin/subjects',icon:School},{label:'Lớp học phần',path:'/admin/course-classes',icon:GraduationCap}]},
 {title:'Quản lý lớp',items:[{label:'Phân công giảng viên',path:'/admin/course-classes',icon:UserPlus},{label:'Danh sách sinh viên',path:'/admin/students/import',icon:Users}]},
 {title:'Hệ thống',items:[{label:'Hồ sơ cá nhân',path:'/profile',icon:Users},{label:'Đổi mật khẩu',path:'/profile',icon:KeyRound}]}
]
const roleMenus={
 LECTURER:[['Tổng quan','/lecturer/dashboard'],['Nhóm sinh viên','/lecturer/groups'],['Duyệt đề tài nhóm','/lecturer/topic-registrations'],['Đợt nộp bài','/lecturer/submission-requirements'],['Bài nộp sinh viên','/lecturer/submissions'],['Hồ sơ','/profile']],
 STUDENT:[['Tổng quan','/student/dashboard'],['Lớp đang tham gia','/student/course-classes'],['Nhóm của tôi','/student/groups/my-group'],['Đăng ký đề tài','/student/topic-registration'],['Yêu cầu nộp bài','/student/submission-requirements'],['Bài nộp của nhóm','/student/submissions'],['Hồ sơ','/profile']]
}
const breadcrumbLabels={'admin':'Quản trị','dashboard':'Tổng quan','users':'Tài khoản','new':'Thêm mới','students':'Sinh viên','lecturers':'Giảng viên','import':'Nhập danh sách','academic-years':'Năm học','semesters':'Học kỳ','subjects':'Môn học','course-classes':'Lớp học phần','profile':'Hồ sơ'}

export default function MainLayout(){
 const navigate=useNavigate(),location=useLocation(),user=getUser(),role=getUserRole(),[mobileOpen,setMobileOpen]=useState(false)
 const name=user?.fullName||user?.FullName||user?.email||user?.Email||'Người dùng'
 const home=role===USER_ROLES.ADMIN?'/admin/dashboard':role===USER_ROLES.LECTURER?'/lecturer/dashboard':'/student/dashboard'
 const logout=()=>{clearAuth();navigate('/login')}
 const breadcrumbs=location.pathname.split('/').filter(Boolean).map((part,index,all)=>({label:breadcrumbLabels[part]||part,path:'/'+all.slice(0,index+1).join('/')}))
 const link=(item)=>{const Icon=item.icon;return <NavLink key={`${item.path}-${item.label}`} to={item.path} onClick={()=>setMobileOpen(false)} className={({isActive})=>isActive?'menu-link active':'menu-link'}>{Icon&&<Icon size={18}/>}<span>{item.label}</span></NavLink>}
 return <div className="app-shell admin-modern-shell">
  <aside className={`sidebar ${mobileOpen?'open':''}`}><div className="brand" onClick={()=>navigate(home)}><div className="brand-logo">TVU</div><div className="brand-text"><h2>Cổng dự án</h2><p>Trường Đại học Trà Vinh</p></div><button className="mobile-close" onClick={e=>{e.stopPropagation();setMobileOpen(false)}} aria-label="Đóng menu"><X size={20}/></button></div>
   <nav className="menu">{role===USER_ROLES.ADMIN?adminSections.map(section=><section className="menu-section" key={section.title}><p>{section.title}</p>{section.items.map(link)}</section>):(roleMenus[role]||[]).map(([label,path])=>link({label,path}))}</nav>
  </aside>{mobileOpen&&<button className="sidebar-backdrop" onClick={()=>setMobileOpen(false)} aria-label="Đóng menu"/>}
  <div className="main-area"><header className="header"><div className="header-leading"><button className="mobile-menu" onClick={()=>setMobileOpen(true)} aria-label="Mở menu"><Menu size={22}/></button><div><h1>{role===USER_ROLES.ADMIN?'Khu vực quản trị':'Cổng quản lý dự án sinh viên'}</h1><div className="breadcrumbs"><span>Trang chủ</span>{breadcrumbs.map(item=><span key={item.path}><ChevronRight size={13}/>{item.label}</span>)}</div></div></div><div className="header-user"><NotificationBell role={role}/><div className="avatar">{name.charAt(0).toUpperCase()}</div><div className="user-info"><strong>{name}</strong><span>{roleText[role]||role}</span></div><button className="logout-btn" onClick={logout}><LogOut size={17}/><span>Đăng xuất</span></button></div></header><main className="content"><Outlet/></main></div>
 </div>
}
