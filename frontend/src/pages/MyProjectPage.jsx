import { mockProjects } from '../data/mockData'

function MyProjectPage() {
  const project = mockProjects[0]

  return (
    <div>
      <div className="page-title">
        <h2>Dự án của tôi</h2>
        <p>Sinh viên theo dõi đề tài đã đăng ký và thông tin giảng viên hướng dẫn.</p>
      </div>

      <div className="panel detail-panel">
        <span className="badge">{project.status}</span>
        <h3>{project.title}</h3>
        <p>{project.description}</p>

        <div className="info-grid">
          <div>
            <label>Giảng viên hướng dẫn</label>
            <strong>{project.teacher}</strong>
          </div>
          <div>
            <label>Thành viên nhóm</label>
            <strong>{project.students}</strong>
          </div>
          <div>
            <label>Lớp</label>
            <strong>{project.className}</strong>
          </div>
          <div>
            <label>Học kỳ</label>
            <strong>{project.semester}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyProjectPage