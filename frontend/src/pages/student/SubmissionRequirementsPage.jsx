import { useEffect, useState } from "react";
import { listStudentRequirements } from "../../api/submissionRequirementsApi";
import {
  getStatusBadgeVariant,
  getStatusLabel,
} from "../../constants/statusLabels";
import { getSubmissionItemLabel } from "../../constants/submissionItemLabels";
import { formatDateRange, formatDateTime } from "../../utils/dateTime";
export default function SubmissionRequirementsPage() {
  const [items, setItems] = useState([]),
    [selected, setSelected] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void listStudentRequirements()
      .then((r) => {
        if (active) setItems(r.data || []);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className="workflow-page">
      <div className="page-title">
        <h2>Yêu cầu nộp bài</h2>
        <p>Xem lịch, hạn nộp và các hạng mục của lớp đang tham gia.</p>
      </div>
      {error && <div className="alert error">{error}</div>}
      <div className="panel table-wrap">
        {loading ? (
          <p>Đang tải...</p>
        ) : items.length ? (
          <table>
            <thead>
              <tr>
                <th>Yêu cầu</th>
                <th>Lớp</th>
                <th>Hạn nộp</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td>{item.title}</td>
                  <td>{item.classCode}</td>
                  <td>{formatDateTime(item.deadline)}</td>
                  <td>
                    <span
                      className={`status-badge ${getStatusBadgeVariant(item.effectiveStatus)}`}
                    >
                      {getStatusLabel(item.effectiveStatus)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">Hiện chưa có yêu cầu nộp bài.</div>
        )}
      </div>
      {selected && (
        <div className="panel">
          <div className="row-between">
            <h3>{selected.title}</h3>
            <button
              className="btn-light compact-button"
              onClick={() => setSelected(null)}
            >
              Đóng
            </button>
          </div>
          <p>{selected.description}</p>
          {selected.instructions && (
            <p>
              <strong>Hướng dẫn:</strong> {selected.instructions}
            </p>
          )}
          <p>
            <strong>Thời gian:</strong>{" "}
            {formatDateRange(selected.startAt, selected.deadline)}
          </p>
          <p>
            <strong>Số lần nộp tối đa:</strong> {selected.maxAttempts} ·{" "}
            <strong>Nộp sau hạn:</strong> {selected.allowLate ? "Có" : "Không"}{" "}
            · <strong>Nộp lại:</strong>{" "}
            {selected.allowResubmission ? "Có" : "Không"}
          </p>
          <div className="item-badges">
            {selected.requiredItems.map((item) => (
              <span key={item.id}>
                {getSubmissionItemLabel(item.type)}
                {item.isRequired ? " · Bắt buộc" : ""}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
