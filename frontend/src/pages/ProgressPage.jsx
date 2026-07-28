import { mockProgress } from "../data/mockData";

function ProgressPage() {
    return (
        <div className="progress-page">
            <div className="page-title row-between">
                <div>
                    <h2>📈 Nộp tiến độ</h2>
                    <p>
                        Theo dõi các lần nộp báo cáo tiến độ và phản hồi từ
                        giảng viên.
                    </p>
                </div>

                <button className="btn btn-primary">+ Nộp tiến độ mới</button>
            </div>

            {/* Thống kê */}
            <div className="progress-summary">
                <div className="card summary-card">
                    <h3>{mockProgress.length}</h3>
                    <span>Tổng lần nộp</span>
                </div>

                <div className="card summary-card">
                    <h3>
                        {
                            mockProgress.filter(
                                (item) => item.status === "Đã duyệt",
                            ).length
                        }
                    </h3>
                    <span>Đã duyệt</span>
                </div>

                <div className="card summary-card">
                    <h3>
                        {
                            mockProgress.filter(
                                (item) => item.status !== "Đã duyệt",
                            ).length
                        }
                    </h3>
                    <span>Đang chờ</span>
                </div>
            </div>

            {/* Danh sách */}
            <div className="panel">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Tuần</th>
                            <th>Dự án</th>
                            <th>Nội dung</th>
                            <th>Tệp đính kèm</th>
                            <th>Trạng thái</th>
                            <th>Nhận xét GV</th>
                        </tr>
                    </thead>

                    <tbody>
                        {mockProgress.map((item) => (
                            <tr key={item.id}>
                                <td>{item.week}</td>

                                <td>{item.projectTitle}</td>

                                <td>{item.content}</td>

                                <td>📄 {item.fileName}</td>

                                <td>
                                    <span
                                        className={
                                            item.status === "Đã duyệt"
                                                ? "badge badge-success"
                                                : "badge badge-warning"
                                        }
                                    >
                                        {item.status}
                                    </span>
                                </td>

                                <td>
                                    {item.comment || (
                                        <span className="text-muted">
                                            Chưa có phản hồi
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ProgressPage;
