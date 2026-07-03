import { mockSubmissions } from '../data/mockData'

function SubmissionsPage() {
  return (
    <div>
      <div className="page-title row-between">
        <div>
          <h2>Nộp cuối kỳ</h2>
          <p>Sinh viên nộp báo cáo, source code và sản phẩm cuối kỳ.</p>
        </div>
        <button className="btn-primary small">Nộp bài</button>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Dự án</th>
              <th>Nhóm sinh viên</th>
              <th>Báo cáo</th>
              <th>Source code</th>
              <th>Trạng thái</th>
              <th>Điểm</th>
            </tr>
          </thead>
          <tbody>
            {mockSubmissions.map((item) => (
              <tr key={item.id}>
                <td>{item.projectTitle}</td>
                <td>{item.studentGroup}</td>
                <td>{item.reportFile}</td>
                <td>{item.sourceCodeUrl}</td>
                <td><span className="badge">{item.status}</span></td>
                <td>{item.score || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SubmissionsPage