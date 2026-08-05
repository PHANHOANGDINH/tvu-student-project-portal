import { useEffect, useState } from 'react'
import { AlertTriangle, BookOpen, GraduationCap, RefreshCw, School, UserCheck, UserRoundX, Users } from 'lucide-react'
import { getRoleDashboard } from '../../api/dashboardApi'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import WelcomeBanner from '../../components/common/WelcomeBanner'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/UiState'

const labels = { classes: 'Lớp học phần', groups: 'Nhóm sinh viên', topicsPending: 'Đề tài chờ duyệt', notSubmitted: 'Chưa nộp', submitted: 'Đã nộp', late: 'Nộp trễ', waitingGrade: 'Chờ chấm', graded: 'Đã chấm', openRequirements: 'Đợt đang mở', unread: 'Thông báo chưa đọc', revisions: 'Yêu cầu chỉnh sửa', publishedGrades: 'Điểm đã công bố' }
const adminCards = [
  ['totalUsers', 'Tổng tài khoản', Users], ['lecturers', 'Tổng giảng viên', GraduationCap], ['students', 'Tổng sinh viên', School],
  ['activeUsers', 'Đang hoạt động', UserCheck], ['inactiveUsers', 'Đã khóa', UserRoundX], ['academicYears', 'Năm học', BookOpen],
  ['semesters', 'Học kỳ', BookOpen], ['subjects', 'Môn học', School], ['classes', 'Lớp học phần', GraduationCap],
  ['activeClasses', 'Lớp đang hoạt động', UserCheck], ['unenrolledStudents', 'Sinh viên chưa xếp lớp', AlertTriangle], ['unassignedClasses', 'Lớp chưa có giảng viên', AlertTriangle]
]

export default function RoleDashboardPage({ role, title }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = () => {
    setLoading(true); setError('')
    getRoleDashboard(role).then(response => setData(response.data)).catch(err => setError(err.message || 'Không thể tải tổng quan')).finally(() => setLoading(false))
  }
  useEffect(load, [role])
  if (loading) return <div className="panel"><LoadingState label="Đang tải tổng quan..." /></div>
  if (error && !data) return <div className="panel"><ErrorState message={error} onRetry={load} /></div>
  if (role === 'admin') return <AdminDashboard data={data} error={error} onRefresh={load} />
  return <RoleDashboard data={data} error={error} title={title} onRefresh={load} />
}

function AdminDashboard({ data, error, onRefresh }) {
  return <div className="admin-page">
    <WelcomeBanner title="Chào mừng trở lại, Quản trị viên" description="Theo dõi nhanh tình hình người dùng, học vụ và vận hành của hệ thống TVU." />
    <PageHeader eyebrow="Tổng quan hệ thống" title="Tổng quan quản trị" description="Theo dõi tài khoản, học vụ và tình trạng vận hành hệ thống." actions={<button className="btn-light" onClick={onRefresh}><RefreshCw size={17} /> Làm mới</button>} />
    {error && <div className="alert error">{error}</div>}
    <div className="admin-stat-grid">{adminCards.map(([key, label, Icon]) => <StatCard key={key} icon={Icon} label={label} value={data?.stats?.[key]} tone={key.includes('unassigned') || key.includes('unenrolled') ? 'warning' : 'primary'} />)}</div>
    <div className="dashboard-grid">
      <section className="panel"><h3>Hoạt động gần đây</h3>{data?.recentActivity?.length ? <div className="activity-list">{data.recentActivity.map(item => <div key={item.id}><span className="activity-avatar">{item.title?.charAt(0)}</span><div><strong>{item.title}</strong><p>{item.status === 'LECTURER' ? 'Giảng viên' : item.status === 'STUDENT' ? 'Sinh viên' : 'Quản trị viên'} · {new Date(item.createdAt).toLocaleString('vi-VN')}</p></div></div>)}</div> : <EmptyState title="Chưa có hoạt động gần đây" description="Hoạt động tài khoản mới sẽ hiển thị tại đây." />}</section>
      <section className="panel"><h3>Cảnh báo quản trị</h3><div className="warning-list"><div><AlertTriangle /><span><strong>{data?.stats?.unassignedClasses ?? 0}</strong> lớp chưa phân công giảng viên</span></div><div><AlertTriangle /><span><strong>{data?.stats?.unenrolledStudents ?? 0}</strong> sinh viên chưa được xếp lớp</span></div><div><UserRoundX /><span><strong>{data?.stats?.inactiveUsers ?? 0}</strong> tài khoản đang bị khóa</span></div></div></section>
    </div>
    <section className="panel"><h3>Lớp chưa phân công giảng viên</h3>{data?.unassignedClasses?.length ? <div className="table-wrap"><table><thead><tr><th>Mã lớp</th><th>Môn học</th><th>Học kỳ</th></tr></thead><tbody>{data.unassignedClasses.map(item => <tr key={item.id}><td><strong>{item.code}</strong></td><td>{item.subjectName}</td><td>{item.semesterName}</td></tr>)}</tbody></table></div> : <EmptyState title="Tất cả lớp đã có giảng viên" description="Hiện không có lớp học phần nào cần phân công." />}</section>
  </div>
}

function RoleDashboard({ data, error, title, onRefresh }) {
  const activities = data?.recentActivity || data?.recentSubmissions || []
  return <div>
    <WelcomeBanner title={`Chào mừng đến với ${title}`} description="Theo dõi lớp học phần, đồ án và các hoạt động quan trọng trong không gian học tập TVU." />
    <PageHeader eyebrow="Không gian học tập" title={title} description="Tổng quan dữ liệu và hoạt động gần đây." actions={<button className="btn-light" onClick={onRefresh}><RefreshCw size={17} /> Làm mới</button>} />
    {error && <div className="alert error">{error}</div>}
    <div className="admin-stat-grid">{Object.entries(data?.stats || {}).map(([key, value]) => <StatCard key={key} label={labels[key] || key} value={value} />)}</div>
    {data?.group && <div className="panel"><h3>Nhóm của tôi</h3><p><strong>{data.group.name}</strong> · {data.group.classCode}</p></div>}
    <div className="dashboard-grid"><div className="panel"><h3>Hạn nộp sắp tới</h3>{data?.upcoming?.length ? data.upcoming.map(item => <p key={item.id}>{item.title} · {item.classCode}</p>) : <EmptyState title="Không có hạn nộp sắp tới" />}</div><div className="panel"><h3>Hoạt động gần đây</h3>{activities.length ? activities.map((item, index) => <p key={item.id || index}>{item.title || item.type} · {item.status}</p>) : <EmptyState title="Chưa có hoạt động" />}</div></div>
  </div>
}
