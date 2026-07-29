import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProjectDetailApi, updateProjectStatusApi } from '../api/adminApi'

function ProjectDetailPage() {
  const { id } = useParams()

  const [project, setProject] = useState(null)
  const [status, setStatus] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadProject()
  }, [id])

  async function loadProject() {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const response = await getProjectDetailApi(id)
      const data = response?.data || response

      setProject(data)
      setStatus(data?.Status || '')
      setRejectReason(data?.RejectReason || '')
    } catch (err) {
      setError(err.message || 'Không thể tải chi tiết dự án')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateStatus() {
    try {
      setError('')
      setSuccess('')

      if (!status) {
        setError('Vui lòng chọn trạng thái')
        return
      }

      if (status === 'Rejected' && !rejectReason.trim()) {
        setError('Vui lòng nhập lý do từ chối đề tài')
        return
      }

      setSaving(true)

      await updateProjectStatusApi(id, {
        status,
        rejectReason: status === 'Rejected' ? rejectReason.trim() : ''
      })

      setSuccess('Cập nhật trạng thái đề tài thành công')
      await loadProject()
    } catch (err) {
      setError(err.message || 'Không thể cập nhật trạng thái đề tài')
    } finally {
      setSaving(false)
    }
  }

  function getProjectStatusText(value) {
    switch (value) {
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
        return value || 'Chưa xác định'
    }
  }

  if (loading) {
    return (
      <div className="panel">
        <p>Đang tải chi tiết dự án...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div>
        {error && <div className="alert error">{error}</div>}

        <div className="panel">
          <p>Không tìm thấy dự án.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-title">
        <h2>{project.Title || '-'}</h2>
        <p>Chi tiết đề tài / dự án sinh viên.</p>
      </div>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      <div className="panel detail-panel">
        <span className="badge">
          {getProjectStatusText(project.Status)}
        </span>

        <h3>Mô tả dự án</h3>
        <p>{project.Description || 'Chưa có mô tả.'}</p>

        <div className="info-grid">
          <div>
            <label>Yêu cầu</label>
            <strong>{project.Requirements || '-'}</strong>
          </div>

          <div>
            <label>Kết quả mong đợi</label>
            <strong>{project.ExpectedOutcome || '-'}</strong>
          </div>

          <div>
            <label>Giảng viên hướng dẫn</label>
            <strong>
              {project.AdvisorTeacherName ||
                project.TeacherName ||
                project.FullName ||
                '-'}
            </strong>
          </div>

          <div>
            <label>Lớp</label>
            <strong>{project.ClassName || '-'}</strong>
          </div>

          <div>
            <label>Số sinh viên tối đa</label>
            <strong>{project.MaxStudents || '-'}</strong>
          </div>

          <div>
            <label>Ngày tạo</label>
            <strong>
              {project.CreatedAt
                ? new Date(project.CreatedAt).toLocaleDateString('vi-VN')
                : '-'}
            </strong>
          </div>
        </div>
      </div>

      <div className="panel detail-panel">
        <h3>Cập nhật trạng thái đề tài</h3>

        <div className="form-group">
          <label>Trạng thái</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">-- Chọn trạng thái --</option>
            <option value="Draft">Bản nháp</option>
            <option value="Pending">Chờ duyệt</option>
            <option value="Approved">Đã duyệt</option>
            <option value="Rejected">Từ chối</option>
            <option value="Closed">Đã đóng</option>
          </select>
        </div>

        {status === 'Rejected' && (
          <div className="form-group">
            <label>Lý do từ chối</label>
            <textarea
              rows="4"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối đề tài"
            />
          </div>
        )}

        <button
          className="btn-primary small"
          onClick={handleUpdateStatus}
          disabled={saving}
        >
          {saving ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
        </button>
      </div>
    </div>
  )
}

export default ProjectDetailPage