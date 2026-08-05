import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    FileText,
    History,
    MessageSquare,
    RefreshCw,
    Star,
} from "lucide-react";
import { getStudentResult } from "../../api/gradingApi";

export default function SubmissionResultPage() {
    const { id } = useParams();
    const nav = useNavigate();

    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        getStudentResult(id)
            .then((r) => setData(r.data))
            .catch((e) => setError(e.message));
    }, [id]);

    return (
        <div className="result-page">
            <div className="page-title result-header">
                <div>
                    <h2>Kết quả bài nộp</h2>
                    <p>
                        {data && `${data.groupName} • ${data.requirementTitle}`}
                    </p>
                </div>

                <button className="btn-secondary" onClick={() => nav(-1)}>
                    <ArrowLeft size={18} />
                    Quay lại
                </button>
            </div>

            {error && <div className="alert error">{error}</div>}

            {!data ? (
                <div className="panel loading-card">
                    <Clock3 size={36} />
                    <p>Đang tải dữ liệu...</p>
                </div>
            ) : (
                <>
                    {/* Điểm */}
                    <div className="panel score-card">
                        <div className="score-header">
                            <div className="score-icon">
                                <Star size={28} />
                            </div>

                            <div>
                                <h3>Kết quả chấm điểm</h3>

                                {data.grade ? (
                                    <div className="score-number">
                                        {data.grade.totalScore}
                                        <span>/{data.grade.maxScore}</span>
                                    </div>
                                ) : (
                                    <div className="score-waiting">
                                        Chưa công bố điểm
                                    </div>
                                )}
                            </div>
                        </div>

                        {data.feedback?.comment && (
                            <div className="feedback-box">
                                <MessageSquare size={18} />
                                <div>
                                    <strong>Nhận xét</strong>
                                    <p>{data.feedback.comment}</p>
                                </div>
                            </div>
                        )}

                        {data.feedback?.revisionRequired && (
                            <div className="alert error">
                                <strong>Yêu cầu chỉnh sửa</strong>
                                <p>{data.feedback.revisionReason}</p>
                            </div>
                        )}
                    </div>

                    {/* Chi tiết điểm */}
                    {data.grade?.scores?.length > 0 && (
                        <div className="panel">
                            <h3>Chi tiết chấm điểm</h3>

                            <div className="criteria-list">
                                {data.grade.scores.map((item) => (
                                    <div
                                        className="criteria-item"
                                        key={item.criterionId}
                                    >
                                        <div>
                                            <strong>{item.name}</strong>

                                            {item.comment && (
                                                <p>{item.comment}</p>
                                            )}
                                        </div>

                                        <span className="criteria-score">
                                            {item.score}/{item.maxScore}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.canResubmit && (
                        <div className="action-bar">
                            <button
                                className="btn-primary"
                                onClick={() =>
                                    nav(
                                        `/student/submission-requirements/${data.requirementId}/submit`,
                                    )
                                }
                            >
                                <RefreshCw size={18} />
                                Nộp lại bài
                            </button>
                        </div>
                    )}

                    {/* Lịch sử */}
                    <div className="panel">
                        <h3>
                            <History size={18} />
                            Lịch sử review
                        </h3>

                        <div className="history-list">
                            {data.history.map((h) => (
                                <div className="history-item" key={h.id}>
                                    <div className="history-icon">
                                        <CheckCircle2 size={18} />
                                    </div>

                                    <div className="history-content">
                                        <div className="history-top">
                                            <strong>{h.eventType}</strong>

                                            <span>{h.toStatus}</span>
                                        </div>

                                        <small>
                                            {new Date(
                                                h.createdAt,
                                            ).toLocaleString("vi-VN")}
                                        </small>

                                        {h.comment && <p>{h.comment}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
