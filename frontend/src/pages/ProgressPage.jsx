import { mockProgress } from '../data/mockData'

function ProgressPage() {
  return (
    <div>
      <div className="page-title row-between">
        <div>
          <h2>Nộp tiến độ</h2>
          <p>Sinh viên nộp báo cáo tiến độ theo tuần/giai đoạn.</p>
        </div>
        <button className="btn-primary small">Nộp tiến độ mới</button>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Tuần/Giai đoạn</th>
              <th>Dự án</th>
              <th>Nội dung</th>
              <th>File</th>
              <th>Trạng thái</th>
              <th>Nhận xét</th>
            </tr>
          </thead>
          <tbody>
            {mockProgress.map((item) => (
              <tr key={item.id}>
                <td>{item.week}</td>
                <td>{item.projectTitle}</td>
                <td>{item.content}</td>
                <td>{item.fileName}</td>
                <td><span className="badge">{item.status}</span></td>
                <td>{item.comment || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ProgressPage