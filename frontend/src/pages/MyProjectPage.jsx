import { mockProjects } from "../data/mockData";
import {
    FaBook,
    FaChalkboardTeacher,
    FaUsers,
    FaUniversity,
    FaCalendarAlt,
    FaCheckCircle,
} from "react-icons/fa";

function MyProjectPage() {
    const project = mockProjects[0];

    return (
        <div className="project-page">
            <div className="page-header">
                <div>
                    <h2>📚 Dự án của tôi</h2>
                    <p>
                        Theo dõi thông tin đề tài, giảng viên hướng dẫn và nhóm
                        thực hiện.
                    </p>
                </div>

                <span
                    className={`status-badge ${
                        project.status === "Đang thực hiện"
                            ? "processing"
                            : "completed"
                    }`}
                >
                    {project.status}
                </span>
            </div>

            <div className="project-card">
                <div className="project-title">
                    <FaBook className="title-icon" />
                    <h3>{project.title}</h3>
                </div>

                <p className="project-description">{project.description}</p>

                <div className="project-info">
                    <div className="info-card">
                        <FaChalkboardTeacher className="info-icon" />
                        <div>
                            <span>Giảng viên hướng dẫn</span>
                            <strong>{project.teacher}</strong>
                        </div>
                    </div>

                    <div className="info-card">
                        <FaUsers className="info-icon" />
                        <div>
                            <span>Thành viên nhóm</span>
                            <strong>{project.students}</strong>
                        </div>
                    </div>

                    <div className="info-card">
                        <FaUniversity className="info-icon" />
                        <div>
                            <span>Lớp</span>
                            <strong>{project.className}</strong>
                        </div>
                    </div>

                    <div className="info-card">
                        <FaCalendarAlt className="info-icon" />
                        <div>
                            <span>Học kỳ</span>
                            <strong>{project.semester}</strong>
                        </div>
                    </div>
                </div>

                <div className="project-actions">
                    <button className="primary-btn">📄 Xem chi tiết</button>

                    <button className="secondary-btn">📤 Nộp báo cáo</button>

                    <button className="success-btn">
                        <FaCheckCircle />
                        Theo dõi tiến độ
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MyProjectPage;
