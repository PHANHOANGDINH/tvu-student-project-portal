import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listLecturerTopics, reviewTopic } from "../../api/groupsApi";
import {
  getStatusBadgeVariant,
  getStatusLabel,
} from "../../constants/statusLabels";

const statuses = ["PENDING", "APPROVED", "REJECTED", "REQUIRES_REVISION"];
export default function LecturerTopicRegistrationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]),
    [status, setStatus] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems((await listLecturerTopics(status)).data || []);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [status]);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      try {
        const response = await listLecturerTopics(status);
        if (active) {
          setItems(response.data || []);
          setError("");
        }
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [status]);
  const review = async (item, next) => {
    if (item.status === "APPROVED") return;
    const comment =
      next === "APPROVED" ? "" : window.prompt("Nhập nội dung phản hồi:");
    if (next !== "APPROVED" && !comment) return;
    try {
      setError("");
      await reviewTopic(item.id, { status: next, comment });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <div className="workflow-page">
      <div className="page-title">
        <h2>Duyệt đăng ký đề tài</h2>
        <p>Duyệt đề tài của các lớp học phần bạn phụ trách.</p>
      </div>
      {error && (
        <div className="alert error">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Đóng">
            ×
          </button>
        </div>
      )}
      <div className="panel workflow-filter">
        <label>
          Trạng thái
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            {statuses.map((value) => (
              <option value={value} key={value}>
                {getStatusLabel(value)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="panel table-wrap">
        {loading ? (
          <p>Đang tải...</p>
        ) : items.length ? (
          <table>
            <thead>
              <tr>
                <th>Đề tài</th>
                <th>Nhóm / lớp</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                    {item.reviewComment && (
                      <small>Phản hồi: {item.reviewComment}</small>
                    )}
                  </td>
                  <td>
                    {item.groupName}
                    <small>{item.classCode}</small>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${getStatusBadgeVariant(item.status)}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td>
                    <div className="compact-actions">
                      <button
                        onClick={() =>
                          navigate(
                            `/lecturer/topic-registration-rounds/${item.roundId}/registrations/${item.id}`,
                          )
                        }
                      >
                        Xem chi tiết
                      </button>
                      {item.status !== "APPROVED" && (
                        <>
                          <button
                            className="btn-primary"
                            onClick={() => review(item, "APPROVED")}
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => review(item, "REQUIRES_REVISION")}
                          >
                            Yêu cầu chỉnh sửa
                          </button>
                          <button onClick={() => review(item, "REJECTED")}>
                            Từ chối
                          </button>
                        </>
                      )}
                      {item.status === "APPROVED" && (
                        <small title="Đề tài đã được duyệt và không thể thay đổi trạng thái.">
                          Đề tài đã được duyệt và không thể thay đổi trạng thái.
                        </small>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <h3>Không có đăng ký đề tài phù hợp.</h3>
          </div>
        )}
      </div>
    </div>
  );
}
