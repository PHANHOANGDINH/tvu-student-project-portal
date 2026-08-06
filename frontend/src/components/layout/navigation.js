import { BarChart3, Bell, BookOpen, FileCheck2, FileUp, FolderKanban, GraduationCap, Layers3, LayoutDashboard, School, UserPlus, UserRound, Users } from 'lucide-react'
import { USER_ROLES } from '../../constants/roles'

const roleLabels = { ADMIN: 'Quản trị viên', LECTURER: 'Giảng viên', STUDENT: 'Sinh viên' }

const sharedProfile = { label: 'Hồ sơ cá nhân', icon: UserRound, path: '/profile' }
const navigations = {
  [USER_ROLES.ADMIN]: {
    homePath: '/admin/dashboard',
    groups: [
      { label: 'Tổng quan', items: [{ label: 'Dashboard', icon: BarChart3, path: '/admin/dashboard' }] },
      { label: 'Người dùng', items: [
        { label: 'Danh sách tài khoản', icon: Users, path: '/admin/users' },
        { label: 'Thêm tài khoản', icon: UserPlus, path: '/admin/users/new' }
      ] },
      { label: 'Nhập dữ liệu', items: [
        { label: 'Nhập sinh viên', icon: FileUp, path: '/admin/students/import' },
        { label: 'Nhập giảng viên', icon: GraduationCap, path: '/admin/lecturers/import' }
      ] },
      { label: 'Học vụ', items: [
        { label: 'Năm học', icon: Layers3, path: '/admin/academic-years' },
        { label: 'Học kỳ', icon: BookOpen, path: '/admin/semesters' },
        { label: 'Môn học', icon: School, path: '/admin/subjects' },
        { label: 'Lớp học phần', icon: GraduationCap, path: '/admin/course-classes' }
      ] },
      { label: 'Tài khoản', items: [sharedProfile] }
    ]
  },
  [USER_ROLES.LECTURER]: {
    homePath: '/lecturer/dashboard',
    groups: [
      { label: 'Không gian giảng dạy', items: [
        { label: 'Trang chủ', icon: LayoutDashboard, path: '/lecturer/dashboard' },
        { label: 'Lớp học phần', icon: GraduationCap, path: '/lecturer/course-classes' },
        { label: 'Nhóm sinh viên', icon: Users, path: '/lecturer/groups' },
        { label: 'Đăng ký đề tài', icon: FolderKanban, path: '/lecturer/topic-registrations' },
        { label: 'Tiến độ và đợt nộp', icon: BookOpen, path: '/lecturer/submission-requirements' },
        { label: 'Bài nộp và chấm điểm', icon: FileCheck2, path: '/lecturer/submissions' }
      ] },
      { label: 'Tài khoản', items: [sharedProfile] }
    ]
  },
  [USER_ROLES.STUDENT]: {
    homePath: '/student/dashboard',
    groups: [
      { label: 'Học tập', items: [
        { label: 'Trang chủ', icon: LayoutDashboard, path: '/student/dashboard' },
        { label: 'Học phần của tôi', icon: School, path: '/student/course-classes' },
        { label: 'Nhóm của tôi', icon: Users, path: '/student/groups/my-group' },
        { label: 'Đề tài', icon: FolderKanban, path: '/student/topic-registration' },
        { label: 'Yêu cầu nộp bài', icon: BookOpen, path: '/student/submission-requirements' },
        { label: 'Tiến độ', icon: BarChart3, path: '/student/progress' },
        { label: 'Bài cuối kỳ và điểm', icon: FileCheck2, path: '/student/final-submissions' },
        { label: 'Thông báo', icon: Bell, path: '/student/notifications' }
      ] },
      { label: 'Tài khoản', items: [sharedProfile] }
    ]
  }
}

export const getRoleLabel = role => roleLabels[role] || 'Người dùng'
export const getNavigation = role => navigations[role] || { homePath: '/login', groups: [] }
