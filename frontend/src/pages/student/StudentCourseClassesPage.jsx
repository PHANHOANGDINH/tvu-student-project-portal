import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRoleDashboard } from '../../api/dashboardApi'

export default function StudentCourseClassesPage() {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getRoleDashboard('student')
      .then((response) => setCount(response?.data?.stats?.classes ?? 0))
      .catch((requestError) => setError(requestError.message || 'Không thể tải thông tin lớp đang tham gia'))
      .finally(() => setLoading(false))
  }, [])

  return <div>
    <div className="page-title"><h2>Lớp đang tham gia</h2><p>Tổng quan lớp học phần của sinh viên.</p></div>
    {error && <div className="alert error">{error}</div>}
    <div className="panel">
      {loading ? <p>Đang tải dữ liệu...</p> : <div className="mini-stat-list"><div><span>Số lớp đang tham gia</span><strong>{count}</strong></div></div>}
      <p className="muted-text">Thông tin nhóm, đề tài và yêu cầu nộp bài được phân quyền theo các lớp này.</p>
      <div className="row-actions"><Link className="btn-light" to="/student/groups/my-group">Xem nhóm của tôi</Link><Link className="btn-light" to="/student/submission-requirements">Xem yêu cầu nộp bài</Link></div>
    </div>
  </div>
}
