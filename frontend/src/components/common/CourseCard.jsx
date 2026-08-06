import { ArrowRight, BookOpen, CalendarDays, GraduationCap, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusBadge } from './UiState'

const coverTones = ['ocean', 'indigo', 'sky', 'navy']

export default function CourseCard({ course, index = 0, to, role = 'student' }) {
  const code = course.code || course.classCode || 'TVU'
  const title = course.subjectName || course.name || 'Lớp học phần'
  const lecturer = role === 'lecturer'
  return <article className="course-card"><div className={`course-cover ${coverTones[index % coverTones.length]}`}><div className="course-cover-pattern" /><span className="course-code"><BookOpen size={15} /> {code}</span><GraduationCap className="course-cover-icon" size={58} /></div><div className="course-card-body"><div className="course-card-heading"><div><span>{course.subjectCode || 'HỌC PHẦN'}</span><h3>{title}</h3></div><StatusBadge status={course.status || 'ACTIVE'} /></div><div className="course-meta"><span><CalendarDays size={15} /> {course.semesterName || 'Học kỳ hiện tại'} · {course.academicYearName}</span><span><UserRound size={15} /> {lecturer ? `${course.studentCount || 0} sinh viên · ${course.groupCount || 0} nhóm` : course.lecturerName || 'Chưa phân công giảng viên'}</span></div>{lecturer && <div className="course-card-counts"><span>{course.topicsPending || 0} đề tài chờ duyệt</span><span>{course.waitingGrade || 0} bài chờ chấm</span></div>}{!lecturer && <div className="course-card-counts"><span>{course.groupId ? course.groupName : 'Chưa tham gia nhóm'}</span><span>{course.topicStatus ? `Đề tài: ${course.topicStatus}` : 'Chưa đăng ký đề tài'}</span></div>}{course.progress != null && <div className="course-progress"><div><span>Tiến độ</span><strong>{course.progress}%</strong></div><div className="progress-track"><span style={{ width: `${Math.min(100, Number(course.progress) || 0)}%` }} /></div></div>}<Link className="course-link" to={to}><span>{lecturer ? 'Quản lý lớp' : 'Vào không gian dự án'}</span><ArrowRight size={17} /></Link></div></article>
}
