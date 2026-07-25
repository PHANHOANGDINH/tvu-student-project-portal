import { useCallback, useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getLecturerTopic, reviewTopic } from "../../api/groupsApi";
import {
  getStatusBadgeVariant,
  getStatusLabel,
} from "../../constants/statusLabels";
import { formatDateTime } from "../../utils/dateTime";
export default function TopicRegistrationReviewPage() {
  const { registrationId } = useParams(),
    navigate = useNavigate(),
    [topic, setTopic] = useState(null),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setTopic((await getLecturerTopic(registrationId)).data);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [registrationId]);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
  const review = async (status) => {
    const needsReason = status !== "APPROVED",
      comment = needsReason
        ? window.prompt(
            status === "REJECTED"
              ? "Nhập lý do từ chối:"
              : "Nhập nội dung cần chỉnh sửa:",
          )
        : "";
    if (needsReason && !comment) return;
    try {
      await reviewTopic(registrationId, { status, comment });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };
  if (!topic)
    return <div className="panel">{error || "Đang tải đăng ký..."}</div>;
  return (
    <div className="workflow-page">
      <div className="page-title row-between">
        <div>
          <h2>{topic.title}</h2>
          <p>
            {topic.roundName || "Đăng ký đề tài"} · {topic.classCode} ·{" "}
            {topic.groupName}
          </p>
        </div>
        <button
          className="btn-light compact-button"
          onClick={() => navigate(-1)}
        >
          Quay lại
        </button>
      </div>
      {error && (
        <div className="alert error">
          <span>{error}</span>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}
      <div className="panel workflow-detail-grid">
        <div>
          <small>Trạng thái</small>
          <span
            className={`status-badge ${getStatusBadgeVariant(topic.status)}`}
          >
            {getStatusLabel(topic.status)}
          </span>
        </div>
        <div>
          <small>Số lần chỉnh sửa</small>
          <strong>{topic.revisionCount || 0}</strong>
        </div>
        <div>
          <small>Thời gian gửi</small>
          <strong>{formatDateTime(topic.createdAt)}</strong>
        </div>
        <section>
          <h3>Nhóm thực hiện</h3>
          <p>
            <strong>Trưởng nhóm:</strong> {topic.leader?.fullName || "—"}
          </p>
          <ul>
            {(topic.members || []).map((member) => (
              <li key={member.studentId}>
                {member.fullName} ({member.userCode})
                {member.isLeader ? " — Trưởng nhóm" : ""}
              </li>
            ))}
          </ul>
          <h3>Mô tả</h3>
          <p>{topic.description}</p>
          <h3>Mục tiêu</h3>
          <p>{topic.objectives || "—"}</p>
          <h3>Phạm vi</h3>
          <p>{topic.scope || "—"}</p>
          <h3>Công nghệ dự kiến</h3>
          <p>{topic.technologies || "—"}</p>
          <h3>Kết quả dự kiến</h3>
          <p>{topic.expectedResults || "—"}</p>
          {topic.referenceUrl && (
            <a
              className="btn-light compact-button"
              href={topic.referenceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={16} /> Mở liên kết tham khảo
            </a>
          )}
          {topic.reviewComment && (
            <div className="alert">
              <strong>Phản hồi:</strong> {topic.reviewComment}
            </div>
          )}
        </section>
      </div>
      <div className="panel">
        <h3>Lịch sử duyệt</h3>
        <div className="review-timeline">
          {(topic.history || []).map((item) => (
            <article key={item.id}>
              <i />
              <div>
                <small>{formatDateTime(item.createdAt)}</small>
                <div className="status-transition">
                  <span
                    className={`status-badge ${getStatusBadgeVariant(item.previousStatus)}`}
                  >
                    {getStatusLabel(item.previousStatus)}
                  </span>
                  <strong>→</strong>
                  <span
                    className={`status-badge ${getStatusBadgeVariant(item.newStatus)}`}
                  >
                    {getStatusLabel(item.newStatus)}
                  </span>
                </div>
                <p>{item.comment || "Không có nhận xét."}</p>
                {item.reviewerName && <small>{item.reviewerName}</small>}
              </div>
            </article>
          ))}
          {!topic.history?.length && <p>Chưa có lịch sử duyệt.</p>}
        </div>
      </div>
      {topic.status !== "APPROVED" ? (
        <div className="panel form-actions">
          <button className="btn-primary" onClick={() => review("APPROVED")}>
            Duyệt
          </button>
          <button onClick={() => review("REQUIRES_REVISION")}>
            Yêu cầu chỉnh sửa
          </button>
          <button onClick={() => review("REJECTED")}>Từ chối</button>
        </div>
      ) : (
        <div className="panel">
          <p>Đề tài đã được duyệt và không thể thay đổi trạng thái.</p>
        </div>
      )}
    </div>
  );
}
