import { useEffect, useState } from "react";
import {
    AlertTriangle,
    BookOpen,
    GraduationCap,
    RefreshCw,
    School,
    UserCheck,
    UserRoundX,
    Users,
} from "lucide-react";
import { getRoleDashboard } from "../../api/dashboardApi";
const labels = {
    classes: "Lớp học phần",
    groups: "Nhóm sinh viên",
    topicsPending: "Đề tài chờ duyệt",
    notSubmitted: "Chưa nộp",
    submitted: "Đã nộp",
    late: "Nộp trễ",
    waitingGrade: "Chờ chấm",
    graded: "Đã chấm",
    openRequirements: "Đợt đang mở",
    unread: "Thông báo chưa đọc",
    revisions: "Yêu cầu chỉnh sửa",
    publishedGrades: "Điểm đã công bố",
};
const adminCards = [
    ["totalUsers", "Tổng tài khoản", Users],
    ["lecturers", "Tổng giảng viên", GraduationCap],
    ["students", "Tổng sinh viên", School],
    ["activeUsers", "Đang hoạt động", UserCheck],
    ["inactiveUsers", "Đã khóa", UserRoundX],
    ["academicYears", "Năm học", BookOpen],
    ["semesters", "Học kỳ", BookOpen],
    ["subjects", "Môn học", School],
    ["classes", "Lớp học phần", GraduationCap],
    ["activeClasses", "Lớp đang hoạt động", UserCheck],
    ["unenrolledStudents", "Sinh viên chưa xếp lớp", AlertTriangle],
    ["unassignedClasses", "Lớp chưa có giảng viên", AlertTriangle],
];
const cardColors = {
    totalUsers: "blue",
    lecturers: "purple",
    students: "green",
    activeUsers: "emerald",
    inactiveUsers: "red",
    academicYears: "orange",
    semesters: "cyan",
    subjects: "indigo",
    classes: "sky",
    activeClasses: "teal",
    unenrolledStudents: "amber",
    unassignedClasses: "rose",
};
export default function RoleDashboardPage({ role, title }) {
    const [data, setData] = useState(null),
        [loading, setLoading] = useState(true),
        [error, setError] = useState("");
    const load = () => {
        setLoading(true);
        setError("");
        getRoleDashboard(role)
            .then((r) => setData(r.data))
            .catch((e) => setError(e.message || "Không thể tải tổng quan"))
            .finally(() => setLoading(false));
    };
    useEffect(load, [role]);
    if (loading)
        return (
            <div className="dashboard-skeleton">
                {[1, 2, 3, 4, 5, 6].map((x) => (
                    <div key={x} />
                ))}
            </div>
        );
    if (role === "admin")
        return (
            <div className="admin-page">
                <div className="dashboard-header">
                    <div>
                        <span className="dashboard-tag">ADMIN DASHBOARD</span>

                        <h1>Tổng quan quản trị</h1>

                        <p>
                            Theo dõi tài khoản, lớp học, sinh viên và tình trạng
                            hoạt động của hệ thống.
                        </p>
                    </div>

                    <button className="refresh-btn" onClick={load}>
                        <RefreshCw size={18} />
                        Làm mới
                    </button>
                </div>
                {error && <div className="alert error">{error}</div>}
                <div className="admin-stat-grid">
                    {adminCards.map(([key, label, Icon]) => (
                        <article
                            key={key}
                            className={`admin-stat-card ${cardColors[key]}`}
                        >
                            <div className="card-top">
                                <div className={`stat-icon ${cardColors[key]}`}>
                                    <Icon size={24} />
                                </div>

                                <div className="stat-more">•••</div>
                            </div>

                            <h2>{data?.stats?.[key] ?? 0}</h2>

                            <span className="card-label">{label}</span>

                            <div className="card-footer">
                                <span>Cập nhật mới nhất</span>
                            </div>
                        </article>
                    ))}
                </div>
                <div className="dashboard-grid">
                    <section className="panel modern-panel">
                        <div className="panel-title">
                            <div>
                                <span className="panel-tag">RECENT</span>

                                <h3>Hoạt động gần đây</h3>

                                <p>
                                    Tài khoản được tạo gần nhất trong hệ thống.
                                </p>
                            </div>
                        </div>

                        {data?.recentActivity?.length ? (
                            <div className="activity-list">
                                {data.recentActivity.map((x) => (
                                    <div className="activity-item" key={x.id}>
                                        <div className="activity-avatar">
                                            {x.title?.charAt(0).toUpperCase()}
                                        </div>

                                        <div className="activity-content">
                                            <strong>{x.title}</strong>

                                            <span>
                                                {x.status === "LECTURER"
                                                    ? "Giảng viên"
                                                    : x.status === "STUDENT"
                                                      ? "Sinh viên"
                                                      : "Quản trị viên"}
                                            </span>
                                        </div>

                                        <div className="activity-time">
                                            {new Date(
                                                x.createdAt,
                                            ).toLocaleDateString("vi-VN")}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state modern-empty">
                                <Users size={40} />

                                <p>Chưa có hoạt động nào.</p>
                            </div>
                        )}
                    </section>
                    <section className="panel modern-panel">
                        <div className="panel-title">
                            <div>
                                <span className="panel-tag warning">
                                    WARNING
                                </span>

                                <h3>Cảnh báo quản trị</h3>

                                <p>Các hạng mục Admin cần xử lý.</p>
                            </div>
                        </div>

                        <div className="warning-grid">
                            <div className="warning-card">
                                <AlertTriangle />

                                <strong>
                                    {data?.stats?.unassignedClasses ?? 0}
                                </strong>

                                <span>Lớp chưa có giảng viên</span>
                            </div>

                            <div className="warning-card">
                                <AlertTriangle />

                                <strong>
                                    {data?.stats?.unenrolledStudents ?? 0}
                                </strong>

                                <span>Sinh viên chưa xếp lớp</span>
                            </div>

                            <div className="warning-card">
                                <UserRoundX />

                                <strong>
                                    {data?.stats?.inactiveUsers ?? 0}
                                </strong>

                                <span>Tài khoản bị khóa</span>
                            </div>
                        </div>
                    </section>
                </div>
                <section className="panel modern-panel">
                    <div className="panel-title">
                        <div>
                            <span className="panel-tag">UNASSIGNED</span>

                            <h3>Lớp chưa phân công giảng viên</h3>

                            <p>
                                Các lớp dưới đây cần được Admin phân công giảng
                                viên phụ trách.
                            </p>
                        </div>
                    </div>

                    {data?.unassignedClasses?.length ? (
                        <div className="modern-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Mã lớp</th>

                                        <th>Môn học</th>

                                        <th>Học kỳ</th>

                                        <th>Trạng thái</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {data.unassignedClasses.map((x) => (
                                        <tr key={x.id}>
                                            <td>
                                                <strong>{x.code}</strong>
                                            </td>

                                            <td>{x.subjectName}</td>

                                            <td>
                                                <span className="semester-badge">
                                                    {x.semesterName}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="status waiting">
                                                    Chưa phân công
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="modern-empty">
                            <UserCheck size={60} />

                            <h4>Tuyệt vời!</h4>

                            <p>
                                Tất cả lớp học phần đều đã có giảng viên phụ
                                trách.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        );
    const activities = data?.recentActivity || data?.recentSubmissions || [];
    return (
        <div>
            <div className="dashboard-header">
                <div>
                    <span className="dashboard-tag">
                        {role.toUpperCase()} DASHBOARD
                    </span>

                    <h1>{title}</h1>

                    <p>Theo dõi nhanh tiến độ và hoạt động gần đây.</p>
                </div>

                <button className="refresh-btn" onClick={load}>
                    <RefreshCw size={18} />
                    Làm mới
                </button>
            </div>
            {error && <div className="alert error">{error}</div>}
            <div className="admin-stat-grid">
                {Object.entries(data?.stats || {}).map(([key, value]) => (
                    <div className="admin-stat-card" key={key}>
                        <div>
                            <span>{labels[key] || key}</span>
                            <strong>{value ?? 0}</strong>
                        </div>
                    </div>
                ))}
            </div>
            {data?.group && (
                <div className="panel">
                    <h3>Nhóm của tôi</h3>
                    <p>
                        <strong>{data.group.name}</strong> ·{" "}
                        {data.group.classCode}
                    </p>
                </div>
            )}
            <div className="dashboard-grid">
                <div className="panel">
                    <h3>Hạn nộp sắp tới</h3>
                    {(data?.upcoming || []).map((x) => (
                        <p key={x.id}>
                            {x.title} · {x.classCode}
                        </p>
                    ))}
                    {!data?.upcoming?.length && (
                        <p>Không có hạn nộp sắp tới.</p>
                    )}
                </div>
                <div className="panel">
                    <h3>Hoạt động gần đây</h3>
                    {activities.map((x, i) => (
                        <p key={x.id || i}>
                            {x.title || x.type} · {x.status}
                        </p>
                    ))}
                    {!activities.length && <p>Chưa có hoạt động.</p>}
                </div>
            </div>
        </div>
    );
}
