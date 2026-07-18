import { useEffect, useState } from 'react'
import { getRoleDashboard } from '../../api/dashboardApi'

const labels = {
  totalUsers: 'Tổng người dùng', admins: 'Quản trị viên', lecturers: 'Giảng viên',
  students: 'Sinh viên', academicYears: 'Năm học', semesters: 'Học kỳ',
  subjects: 'Môn học', classes: 'Lớp học phần', groups: 'Nhóm sinh viên',
  topics: 'Đề tài', topicsPending: 'Đề tài chờ duyệt', topicsApproved: 'Đề tài đã duyệt',
  topicsRejected: 'Đề tài bị từ chối', topicsRevision: 'Đề tài cần sửa',
  requirements: 'Yêu cầu nộp', submissions: 'Bài nộp', onTime: 'Nộp đúng hạn',
  late: 'Nộp trễ', graded: 'Đã chấm', ungraded: 'Chưa chấm',
  submitted: 'Đã nộp', notSubmitted: 'Chưa nộp', waitingGrade: 'Chờ chấm',
  openRequirements: 'Đợt đang mở', unread: 'Thông báo chưa đọc',
  revisions: 'Yêu cầu chỉnh sửa', publishedGrades: 'Điểm đã công bố'
}

export default function RoleDashboardPage({ role, title }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    setError('')
    getRoleDashboard(role)
      .then((response) => setData(response.data))
      .catch((requestError) => setError(requestError.message || 'Không thể tải dashboard'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [role])

  if (loading) return <div className="panel">Đang tải dashboard...</div>

  const activities = data?.recentActivity || data?.recentSubmissions || []

  return <div>
    <div className="page-title row-between">
      <div><h2>{title}</h2><p>Tổng quan dữ liệu và hoạt động gần đây.</p></div>
      <button className="btn-light" onClick={load}>Làm mới</button>
    </div>
    {error && <div className="alert error">{error}</div>}
    {!data && !error && <div className="panel">Không có dữ liệu dashboard.</div>}
    <div className="dashboard-stat-grid">
      {Object.entries(data?.stats || {}).map(([key, value]) => <div className="stat-card" key={key}><div><span>{labels[key] || key}</span><strong>{value ?? 0}</strong></div></div>)}
    </div>
    {data?.group && <div className="panel"><h3>Nhóm của tôi</h3><p><strong>{data.group.name}</strong> · {data.group.classCode}</p><p>Đề tài: {data.group.topicTitle || 'Chưa đăng ký'} · {data.group.topicStatus || '-'}</p></div>}
    <div className="dashboard-grid">
      <div className="panel"><h3>Hạn nộp sắp tới</h3>{(data?.upcoming || []).map((item) => <p key={item.id}><strong>{item.title}</strong> · {item.classCode} · {new Date(item.deadline).toLocaleString('vi-VN')}</p>)}{!data?.upcoming?.length && <p>Không có hạn nộp sắp tới.</p>}</div>
      <div className="panel"><h3>Hoạt động gần đây</h3>{activities.map((item, index) => <p key={item.id || `${item.submissionId}-${index}`}>{item.title || item.type} · {item.status} · {new Date(item.createdAt || item.submittedAt).toLocaleString('vi-VN')}</p>)}{!activities.length && <p>Chưa có hoạt động.</p>}</div>
    </div>
    {data?.publishedGrades?.length > 0 && <div className="panel"><h3>Điểm đã công bố</h3>{data.publishedGrades.map((item) => <p key={item.submissionId}>{item.title}: <strong>{item.totalScore}/{item.maxScore}</strong></p>)}</div>}
  </div>
}
