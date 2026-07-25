import { useCallback, useEffect, useMemo, useState } from "react";
import { Inbox } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { listLecturerRequirements } from "../../api/submissionRequirementsApi";
import { lecturerRequirementSubmissions } from "../../api/submissionsApi";
import {
  getStatusBadgeVariant,
  getStatusLabel,
} from "../../constants/statusLabels";
import { formatDateTime } from "../../utils/dateTime";

const FILTER_STATUSES = [
  "SUBMITTED",
  "LATE",
  "RESUBMITTED",
  "UNDER_REVIEW",
  "REQUIRES_REVISION",
  "COMPLETED",
  "NOT_MET",
];
export default function SubmissionsPage() {
  const navigate = useNavigate(),
    { id } = useParams();
  const [requirements, setRequirements] = useState([]),
    [requirementId, setRequirementId] = useState(id || ""),
    [status, setStatus] = useState(""),
    [items, setItems] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const requirementRows = (await listLecturerRequirements()).data || [];
      setRequirements(requirementRows);
      const selected = requirementId
        ? requirementRows.filter(
            (item) => String(item.id) === String(requirementId),
          )
        : requirementRows;
      const responses = await Promise.all(
        selected.map((item) => lecturerRequirementSubmissions(item.id)),
      );
      setItems(responses.flatMap((response) => response.data || []));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [requirementId]);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
  const shown = useMemo(
    () => items.filter((item) => !status || item.status === status),
    [items, status],
  );
  return (
    <div className="workflow-page">
      <div className="page-title">
        <h2>Bài nộp sinh viên</h2>
        <p>Xem bài nộp thuộc yêu cầu và lớp bạn phụ trách.</p>
      </div>
      {error && <div className="alert error">{error}</div>}
      <div className="panel workflow-filter">
        <label>
          Chọn yêu cầu nộp
          <select
            value={requirementId}
            onChange={(e) => setRequirementId(e.target.value)}
          >
            <option value="">Tất cả yêu cầu</option>
            {requirements.map((item) => (
              <option value={item.id} key={item.id}>
                {item.weekNumber ? `Tuần ${item.weekNumber} — ` : ""}
                {item.title} · {item.classCode} · Hạn{" "}
                {formatDateTime(item.deadline, { connector: ", " })}
              </option>
            ))}
          </select>
        </label>
        <label>
          Trạng thái
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            {FILTER_STATUSES.map((value) => (
              <option value={value} key={value}>
                {getStatusLabel(value)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="panel table-wrap">
        {loading ? (
          <p>Đang tải danh sách...</p>
        ) : shown.length ? (
          <table>
            <thead>
              <tr>
                <th>Nhóm</th>
                <th>Yêu cầu / lớp</th>
                <th>Lần nộp</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((item) => (
                <tr key={item.id}>
                  <td>{item.groupName}</td>
                  <td>
                    <strong>{item.requirementTitle}</strong>
                    <small>{item.classCode}</small>
                  </td>
                  <td>{item.latestAttemptNumber}</td>
                  <td>
                    <span
                      className={`status-badge ${getStatusBadgeVariant(item.status)}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() =>
                        navigate(`/lecturer/submissions/${item.id}/review`)
                      }
                    >
                      Xem bài nộp
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <Inbox size={42} />
            <h3>Chưa có bài nộp phù hợp với bộ lọc.</h3>
            <p>Thử chọn yêu cầu hoặc trạng thái khác.</p>
          </div>
        )}
      </div>
    </div>
  );
}
