import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusBadge } from './UiState'

const lecturerTabs = id => [['Tổng quan', `/lecturer/course-classes/${id}`], ['Sinh viên', `/lecturer/course-classes/${id}?tab=students`], ['Nhóm sinh viên', `/lecturer/groups?courseClassId=${id}`], ['Đăng ký đề tài', `/lecturer/topic-registrations?courseClassId=${id}`], ['Mốc tiến độ', `/lecturer/submission-requirements?courseClassId=${id}`], ['Báo cáo tiến độ', `/lecturer/submissions?courseClassId=${id}`], ['Bài nộp', `/lecturer/submissions?courseClassId=${id}`], ['Chấm điểm', `/lecturer/submissions?courseClassId=${id}`], ['Thông báo', `/lecturer/course-classes/${id}?tab=notifications`]]
const studentTabs = id => [['Tổng quan', `/student/course-classes/${id}`], ['Nhóm của tôi', `/student/groups/my-group?courseClassId=${id}`], ['Đề tài', `/student/topic-registration?courseClassId=${id}`], ['Tiến độ', `/student/progress?courseClassId=${id}`], ['Bài nộp', `/student/submission-requirements?courseClassId=${id}`], ['Phản hồi', `/student/submissions?courseClassId=${id}`], ['Điểm', `/student/final-submissions?courseClassId=${id}`], ['Thông báo', `/student/notifications?courseClassId=${id}`]]

export default function ClassWorkspace({ course, role }) {
  if (!course || !Number.isInteger(Number(course.id))) return null
  const root = `/${role}/course-classes/${course.id}`
  const tabs = role === 'lecturer' ? lecturerTabs(course.id) : studentTabs(course.id)
  return <div className="class-workspace">
    <Link className="back-link" to={`/${role}/course-classes`}><ArrowLeft size={17} /> Học phần của tôi</Link>
    <section className="workspace-header"><div><span className="eyebrow">{course.subjectCode} · {course.semesterName} · {course.academicYearName}</span><h2>{course.subjectName}</h2><p><strong>{course.code}</strong> · {role === 'lecturer' ? `${course.studentCount || 0} sinh viên · ${course.groupCount || 0} nhóm` : course.lecturerName || 'Chưa phân công giảng viên'}</p></div><StatusBadge status={course.status} /></section>
    <nav className="workspace-tabs" aria-label="Không gian lớp học phần">{tabs.map(([label, path]) => <Link key={label} className={path === root ? 'active' : ''} to={path}>{label}</Link>)}</nav>
    <section className="panel workspace-overview"><h3>Không gian dự án theo lớp</h3><p>Mọi nhóm, đề tài, tiến độ, bài nộp và điểm trong khu vực này được giới hạn theo lớp <strong>{course.code}</strong>.</p><div className="workspace-metrics"><div><span>Sinh viên</span><strong>{course.studentCount ?? '—'}</strong></div><div><span>Nhóm</span><strong>{course.groupCount ?? (course.groupId ? 1 : 0)}</strong></div><div><span>Đề tài</span><strong>{course.topicStatus ? 'Đã đăng ký' : 'Chưa đăng ký'}</strong></div><div><span>Trạng thái</span><strong>{course.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã kết thúc'}</strong></div></div></section>
    {role === 'student' && !course.groupId && <section className="panel empty-state"><h3>Bạn chưa tham gia nhóm trong lớp học phần này.</h3><p>Liên hệ giảng viên phụ trách hoặc mở mục Nhóm của tôi để tham gia khi lớp cho phép.</p></section>}
    {role === 'student' && course.groupId && !course.topicStatus && <section className="panel empty-state"><h3>Nhóm chưa có đề tài được phê duyệt.</h3><p>Bạn vẫn có thể theo dõi các yêu cầu và chờ giảng viên phê duyệt đề tài.</p></section>}
  </div>
}
