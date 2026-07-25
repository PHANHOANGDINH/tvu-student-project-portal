/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { currentSubmission, uploadSubmission } from "../../api/submissionsApi";
import {
  getSubmissionItemDescription,
  getSubmissionItemLabel,
} from "../../constants/submissionItemLabels";
import { formatDateTime } from "../../utils/dateTime";
const URL_TYPES = new Set([
  "GITHUB_REPOSITORY",
  "GITHUB_PULL_REQUEST",
  "JIRA_BOARD",
  "FIGMA",
  "DEMO_VIDEO",
  "OTHER_URL",
]);
export default function SubmitRequirementPage() {
  const { id } = useParams(),
    navigate = useNavigate(),
    [data, setData] = useState(null),
    [values, setValues] = useState({}),
    [files, setFiles] = useState({}),
    [progress, setProgress] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [now] = useState(() => Date.now());
  const load = () => {
    setLoading(true);
    return currentSubmission(id)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message || "Không thể tải yêu cầu tiến độ."))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, [id]);
  const submit = async (e) => {
    e.preventDefault();
    const requirement = data.requirement,
      missing = requirement.requiredItems.find(
        (item) =>
          item.isRequired &&
          (item.type === "REPORT_FILE"
            ? !files[item.id]
            : !String(values[item.id] || "").trim()),
      );
    if (missing) {
      setError(
        `Vui lòng nhập mục bắt buộc: ${getSubmissionItemLabel(missing.type)}`,
      );
      return;
    }
    if (!window.confirm("Xác nhận gửi tiến độ tuần này?")) return;
    const body = new FormData(),
      responses = [];
    for (const item of requirement.requiredItems) {
      if (item.type === "REPORT_FILE") {
        if (files[item.id]) body.append(`item_${item.id}`, files[item.id]);
      } else if (String(values[item.id] || "").trim())
        responses.push({
          itemId: item.id,
          value: String(values[item.id]).trim(),
        });
    }
    body.append("responses", JSON.stringify(responses));
    try {
      setLoading(true);
      setProgress(0);
      const result = await uploadSubmission(id, body, setProgress),
        submissionId = result?.data?.id || data.submission?.id;
      await load();
      if (submissionId) navigate(`/student/progress/${id}/history`);
    } catch (e) {
      setError(e.message || "Không thể gửi tiến độ.");
    } finally {
      setLoading(false);
    }
  };
  if (!data)
    return (
      <div className="panel">
        {loading ? "Đang tải..." : error || "Không có dữ liệu."}
      </div>
    );
  const r = data.requirement,
    attempts = data.attempts || [],
    late = now > new Date(r.deadline).getTime(),
    remaining = Math.max(0, r.maxAttempts - attempts.length);
  return (
    <div>
      <div className="page-title">
        <h2>{r.title || `Tiến độ tuần ${r.weekNumber || ""}`}</h2>
        <p>
          Mở {formatDateTime(r.startAt)} · Hạn {formatDateTime(r.deadline)}
        </p>
      </div>
      <div className="panel row-between">
        <span>
          Đã nộp {attempts.length}/{r.maxAttempts} lần
        </span>
        <strong>Còn {remaining} lần nộp</strong>
      </div>
      {late && (
        <div className="alert error">
          Đã quá hạn. Bài nộp sẽ được đánh dấu trễ nếu yêu cầu cho phép.
        </div>
      )}
      {error && <div className="alert error">{error}</div>}
      <form className="panel workflow-form" onSubmit={submit}>
        {r.requiredItems.map((item) => {
          const label = getSubmissionItemLabel(item.type);
          return (
            <label key={item.id}>
              {label}
              {item.isRequired && " *"}
              <small>
                {item.description || getSubmissionItemDescription(item.type)}
              </small>
              {item.type === "REPORT_FILE" ? (
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  required={item.isRequired}
                  onChange={(e) =>
                    setFiles({ ...files, [item.id]: e.target.files?.[0] })
                  }
                />
              ) : URL_TYPES.has(item.type) ? (
                <input
                  type="url"
                  required={item.isRequired}
                  placeholder="https://..."
                  value={values[item.id] || ""}
                  onChange={(e) =>
                    setValues({ ...values, [item.id]: e.target.value })
                  }
                />
              ) : (
                <textarea
                  required={item.isRequired}
                  rows="4"
                  value={values[item.id] || ""}
                  onChange={(e) =>
                    setValues({ ...values, [item.id]: e.target.value })
                  }
                />
              )}
            </label>
          );
        })}
        <button className="btn-primary" disabled={loading || remaining < 1}>
          {loading
            ? `Đang gửi${progress ? ` ${progress}%` : ""}`
            : "Gửi tiến độ"}
        </button>
      </form>
      {data.submission && (
        <button
          className="btn-light"
          onClick={() => navigate(`/student/progress/${id}/history`)}
        >
          Xem lịch sử
        </button>
      )}
    </div>
  );
}
