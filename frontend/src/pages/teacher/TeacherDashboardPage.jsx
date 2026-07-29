import { useEffect, useMemo, useState } from 'react'
import {
  getTeacherFinalSubmissionsApi,
  getTeacherProgressReportsApi,
  getTeacherProjectsApi,
  getTeacherWorkspaceApi
} from '../../api/teacherApi'
import { getUser } from '../../utils/auth'

function TeacherDashboardPage() {
  const currentUser = getUser()

  const [workspace, setWorkspace] = useState(null)
  const [projects, setProjects] = useState([])
  const [progressReports, setProgressReports] = useState([])
  const [finalSubmissions, setFinalSubmissions] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      setLoading(true)
      setError('')

      const [
        workspaceResponse,
        projectsResponse,
        progressResponse,
        finalResponse
      ] = await Promise.all([
        getTeacherWorkspaceApi().catch(() => null),
        getTeacherProjectsApi({ limit: 100 }),
        getTeacherProgressReportsApi({ limit: 100 }),
        getTeacherFinalSubmissionsApi({ limit: 100 })
      ])

      setWorkspace(workspaceResponse)

      setProjects(Array.isArray(projectsResponse?.data) ? projectsResponse.data : [])
      setProgressReports(
        Array.isArray(progressResponse?.data) ? progressResponse.data : []
      )
      setFinalSubmissions(
        Array.isArray(finalResponse?.data) ? finalResponse.data : []
      )
    } catch (err) {
      setError(err.message || 'Không thể tải dashboard giảng viên')
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    const totalProjects = projects.length

    const pendingProjects = projects.filter(
      (item) => item.Status === 'Pending'
    ).length

    const approvedProjects = projects.filter(
      (item) => item.Status === 'Approved'
    ).length

    const rejectedProjects = projects.filter(
      (item) => item.Status === 'Rejected'
    ).length

    const closedProjects = projects.filter(
      (item) => item.Status === 'Closed'
    ).length

    const totalProgressReports = progressReports.length

    const reviewedProgressReports = progressReports.filter(
      (item) =>
        item.TeacherScore !== null &&
        item.TeacherScore !== undefined
    ).length

    const unreviewedProgressReports =
      totalProgressReports - reviewedProgressReports

    const totalFinalSubmissions = finalSubmissions.length

    const reviewedFinalSubmissions = finalSubmissions.filter(
      (item) =>
        item.TeacherScore !== null &&
        item.TeacherScore !== undefined
    ).length

    const unreviewedFinalSubmissions =
      totalFinalSubmissions - reviewedFinalSubmissions

    return {
      totalProjects,
      pendingProjects,
      approvedProjects,
      rejectedProjects,
      closedProjects,
      totalProgressReports,
      reviewedProgressReports,
      unreviewedProgressReports,
      totalFinalSubmissions,
      reviewedFinalSubmissions,
      unreviewedFinalSubmissions
    }
  }, [projects, progressReports, finalSubmissions])

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => new Date(b.CreatedAt || 0) - new Date(a.CreatedAt || 0))
      .slice(0, 5)
  }, [projects])

  const recentProgressReports = useMemo(() => {
    return [...progressReports]
      .sort((a, b) => new Date(b.CreatedAt || 0) - new Date(a.CreatedAt || 0))
      .slice(0, 5)
  }, [progressReports])

  function getStatusText(status) {
    switch (status) {
      case 'Pending':
        return 'Chờ duyệt'
      case 'Approved':
        return 'Đã duyệt'
      case 'Rejected':
        return 'Từ chối'
      case 'Closed':
        return 'Đã đóng'
      case 'Submitted':
        return 'Đã nộp'
      case 'Reviewed':
        return 'Đã nhận xét'
      default:
        return status || '-'
    }
  }

  function getStatusClass(status) {
    if (status === 'Approved' || status === 'Reviewed') return 'badge green'
    if (status === 'Rejected') return 'badge'
    if (status === 'Closed') return 'badge'
    return 'badge blue'
  }

  if (loading) {
    return (
      <div>
        <div className="page-title">
          <h2>Dashboard giảng viên</h2>
          <p>Đang tải dữ liệu...</p>
        </div>

        <div className="panel">
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-title row-between">
        <div>
          <h2>Dashboard giảng viên</h2>
          <p>
            Xin chào,{' '}
            <strong>
              {currentUser?.fullName ||
                currentUser?.FullName ||
                workspace?.user?.fullName ||
                workspace?.user?.FullName ||
                'Giảng viên'}
            </strong>
          </p>
        </div>

        <button className="btn-light" onClick={loadDashboard}>
          Làm mới
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="stat-grid dashboard-stat-grid">
        <div className="stat-card">
          <span>Tổng đề tài</span>
          <strong>{stats.totalProjects}</strong>
          <p>Đề tài do giảng viên tạo</p>
        </div>

        <div className="stat-card">
          <span>Đề tài đã duyệt</span>
          <strong>{stats.approvedProjects}</strong>
          <p>Đề tài sinh viên có thể đăng ký</p>
        </div>

        <div className="stat-card">
          <span>Đề tài chờ duyệt</span>
          <strong>{stats.pendingProjects}</strong>
          <p>Đề tài đang chờ admin duyệt</p>
        </div>

        <div className="stat-card">
          <span>Báo cáo tiến độ</span>
          <strong>{stats.totalProgressReports}</strong>
          <p>Sinh viên đã nộp tiến độ</p>
        </div>

        <div className="stat-card">
          <span>Tiến độ chưa nhận xét</span>
          <strong>{stats.unreviewedProgressReports}</strong>
          <p>Cần giảng viên xem và phản hồi</p>
        </div>

        <div className="stat-card">
          <span>Bài cuối kỳ chưa chấm</span>
          <strong>{stats.unreviewedFinalSubmissions}</strong>
          <p>Bài nộp cuối kỳ cần chấm điểm</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <h3>Trạng thái đề tài</h3>

          <div className="mini-stat-list">
            <div>
              <span>Chờ duyệt</span>
              <strong>{stats.pendingProjects}</strong>
            </div>

            <div>
              <span>Đã duyệt</span>
              <strong>{stats.approvedProjects}</strong>
            </div>

            <div>
              <span>Bị từ chối</span>
              <strong>{stats.rejectedProjects}</strong>
            </div>

            <div>
              <span>Đã đóng</span>
              <strong>{stats.closedProjects}</strong>
            </div>
          </div>
        </div>

        <div className="panel">
          <h3>Tình trạng chấm / nhận xét</h3>

          <div className="mini-stat-list">
            <div>
              <span>Tiến độ đã nhận xét</span>
              <strong>{stats.reviewedProgressReports}</strong>
            </div>

            <div>
              <span>Tiến độ chưa nhận xét</span>
              <strong>{stats.unreviewedProgressReports}</strong>
            </div>

            <div>
              <span>Cuối kỳ đã chấm</span>
              <strong>{stats.reviewedFinalSubmissions}</strong>
            </div>

            <div>
              <span>Cuối kỳ chưa chấm</span>
              <strong>{stats.unreviewedFinalSubmissions}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <h3>Đề tài mới nhất</h3>

          <table>
            <thead>
              <tr>
                <th>Tên đề tài</th>
                <th>Trạng thái</th>
                <th>Số SV</th>
              </tr>
            </thead>

            <tbody>
              {recentProjects.map((item) => (
                <tr key={item.Id}>
                  <td>{item.Title || '-'}</td>
                  <td>
                    <span className={getStatusClass(item.Status)}>
                      {getStatusText(item.Status)}
                    </span>
                  </td>
                  <td>
                    {item.ApprovedStudents || item.TotalApprovedStudents || 0}/
                    {item.MaxStudents || 1}
                  </td>
                </tr>
              ))}

              {recentProjects.length === 0 && (
                <tr>
                  <td colSpan="3">Chưa có đề tài nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <h3>Báo cáo tiến độ mới nhất</h3>

          <table>
            <thead>
              <tr>
                <th>Sinh viên</th>
                <th>Đề tài</th>
                <th>Điểm</th>
              </tr>
            </thead>

            <tbody>
              {recentProgressReports.map((item) => (
                <tr key={item.Id}>
                  <td>{item.StudentName || item.FullName || '-'}</td>
                  <td>{item.ProjectTitle || item.Title || '-'}</td>
                  <td>
                    {item.TeacherScore !== null &&
                    item.TeacherScore !== undefined
                      ? item.TeacherScore
                      : 'Chưa chấm'}
                  </td>
                </tr>
              ))}

              {recentProgressReports.length === 0 && (
                <tr>
                  <td colSpan="3">Chưa có báo cáo tiến độ.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default TeacherDashboardPage