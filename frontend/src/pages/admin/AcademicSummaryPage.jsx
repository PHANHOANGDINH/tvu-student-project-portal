import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRoleDashboard } from '../../api/dashboardApi'

export default function AcademicSummaryPage({ resource, title }) {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    getRoleDashboard('admin')
      .then((response) => setCount(response?.data?.stats?.[resource] ?? 0))
      .catch((requestError) => setError(requestError.message || `Không thể tải dữ liệu ${title.toLowerCase()}`))
      .finally(() => setLoading(false))
  }, [resource, title])

  return <div>
    <div className="page-title"><h2>{title}</h2><p>Tổng quan danh mục đào tạo trong hệ thống.</p></div>
    {error && <div className="alert error">{error}</div>}
    <div className="panel">
      {loading ? <p>Đang tải dữ liệu...</p> : <div className="mini-stat-list"><div><span>Tổng số {title.toLowerCase()}</span><strong>{count}</strong></div></div>}
      <p className="muted-text">Danh mục này hiện được hiển thị ở chế độ tổng quan. Các thao tác quản trị chi tiết chưa có API tương ứng.</p>
      <Link className="btn-light" to="/admin/course-classes">Xem lớp học phần</Link>
    </div>
  </div>
}
