import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    BookOpen,
    CalendarDays,
    ChevronRight,
    FileText,
    Loader2,
} from "lucide-react";
import { listStudentRequirements } from "../../api/submissionRequirementsApi";

export default function SubmissionsPage() {
    const nav = useNavigate();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        listStudentRequirements()
            .then((r) => setItems(r.data || []))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case "open":
            case "đang mở":
                return "status success";

            case "closed":
            case "đã đóng":
                return "status danger";

            case "submitted":
            case "đã nộp":
                return "status primary";

            default:
                return "status";
        }
    };

    return (
        <div className="submissions-page">
            <div className="page-title">
                <h2>Bài nộp của nhóm</h2>
                <p>
                    Chọn yêu cầu để nộp tài liệu hoặc xem lại các lần nộp trước.
                </p>
            </div>

            {error && <div className="alert error">{error}</div>}

            {loading ? (
                <div className="panel loading-box">
                    <Loader2 className="spin" size={40} />
                    <p>Đang tải danh sách bài nộp...</p>
                </div>
            ) : items.length === 0 ? (
                <div className="panel empty-box">
                    <FileText size={60} />
                    <h3>Chưa có yêu cầu nộp</h3>
                    <p>Hiện tại giảng viên chưa tạo yêu cầu nộp nào.</p>
                </div>
            ) : (
                <div className="submission-grid">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="submission-card"
                        >
                            <div className="submission-top">
                                <div className="submission-icon">
                                    <FileText size={24} />
                                </div>

                                <span
                                    className={getStatusClass(
                                        item.effectiveStatus
                                    )}
                                >
                                    {item.effectiveStatus}
                                </span>
                            </div>

                            <h3>{item.title}</h3>

                            <div className="submission-info">
                                <div>
                                    <BookOpen size={16} />
                                    <span>{item.classCode}</span>
                                </div>

                                <div>
                                    <CalendarDays size={16} />
                                    <span>
                                        {new Date(
                                            item.deadline
                                        ).toLocaleString("vi-VN")}
                                    </span>
                                </div>
                            </div>

                            <button
                                className="btn-primary open-btn"
                                onClick={() =>
                                    nav(
                                        `/student/submission-requirements/${item.id}/submit`
                                    )
                                }
                            >
                                Mở yêu cầu
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}