import { mockProgress, mockSubmissions } from '../data/mockData'

function ReviewsPage() {
  return (
    <div>
      <div className="page-title">
        <h2>Duyệt / Nhận xét</h2>
        <p>Giảng viên xem tiến độ, nhận xét và duyệt bài nộp của sinh viên.</p>
      </div>

      <div className="panel">
        <h3>Tiến độ chờ duyệt</h3>
        <table>
          <thead>
            <tr>
              <th>Tuần</th>
              <th>Dự án</th>
              <th>Nội dung</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {mockProgress.map((item) => (
              <tr key={item.id}>
                <td>{item.week}</td>
                <td>{item.projectTitle}</td>
                <td>{item.content}</td>
                <td><span className="badge">{item.status}</span></td>
                <td>
                  <button className="btn-primary small">Duyệt</button>
                  <button className="btn-light">Nhận xét</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h3>Bài nộp cuối kỳ</h3>
        <table>
          <thead>
            <tr>
              <th>Dự án</th>
              <th>Nhóm</th>
              <th>Báo cáo</th>
              <th>Trạng thái</th>
              <th>Điểm</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {mockSubmissions.map((item) => (
              <tr key={item.id}>
                <td>{item.projectTitle}</td>
                <td>{item.studentGroup}</td>
                <td>{item.reportFile}</td>
                <td><span className="badge">{item.status}</span></td>
                <td>{item.score || '-'}</td>
                <td>
                  <button className="btn-primary small">Chấm điểm</button>
                  <button className="btn-light">Nhận xét</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ReviewsPage