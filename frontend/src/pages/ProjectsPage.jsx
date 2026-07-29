import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProjectsApi } from '../api/adminApi'

function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      setLoading(true)
      setError('')

      const response = await getProjectsApi()
      const list = response?.data || []

      setProjects(Array.isArray(list) ? list : [])
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách dự án / đề tài')
    } finally {
      setLoading(false)
    }
  }

  function getProjectStatusText(status) {
    switch (status) {
      case 'Draft':
        return 'Bản nháp'
      case 'Pending':
        return 'Chờ duyệt'
      case 'Approved':
        return 'Đã duyệt'
      case 'Rejected':
        return 'Từ chối'
      case 'Closed':
        return 'Đã đóng'
      default:
        return status || 'Chưa xác định'
    }
  }

  function getProjectStatusClass(status) {
    switch (status) {
      case 'Approved':
        return 'badge green'
      case 'Pending':
      case 'Draft':
        return 'badge'
      case 'Rejected':
      case 'Closed':
        return 'badge'
      default:
        return 'badge'
    }
  }

  return (
    <div>
      <div className="page-title row-between">
        <div>
          <h2>Quản lý dự án / đề tài</h2>
          <p>Quản lý danh sách đề tài, giảng viên hướng dẫn và trạng thái thực hiện.</p>
        </div>

        <button className="btn-primary small">Tạo đề tài</button>
      </div>

      {error && <div className="alert error">{error}</div>}

      {loading ? (
        <div className="panel">
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <div className="project-card" key={project.Id}>
              <div className="project-card-header">
                <span className={getProjectStatusClass(project.Status)}>
                  {getProjectStatusText(project.Status)}
                </span>

                <span>
                  {project.AcademicYear || '-'}
                </span>
              </div>

              <h3>{project.Title || '-'}</h3>

              <p>
                {project.Description || 'Chưa có mô tả cho đề tài này.'}
              </p>

              <div className="project-meta">
                <span>
                  <strong>GVHD:</strong>{' '}
                  {project.AdvisorTeacherName ||
                    project.TeacherName ||
                    project.AdvisorName ||
                    '-'}
                </span>

                <span>
                  <strong>Lớp:</strong>{' '}
                  {project.ClassName || '-'}
                </span>

                <span>
                  <strong>Số lượng tối đa:</strong>{' '}
                  {project.MaxStudents || '-'} sinh viên
                </span>
              </div>

              <div className="card-actions">
                <Link
                  className="btn-light link-btn"
                  to={`/projects/${project.Id}`}
                >
                  Xem chi tiết
                </Link>

                <button className="btn-primary small">
                  Đăng ký
                </button>
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="panel">
              <p>Chưa có dữ liệu dự án / đề tài.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProjectsPage