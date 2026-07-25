import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  currentSubmission,
  downloadSubmissionFile,
  studentSubmission,
} from "../../api/submissionsApi";
import {
  getStatusBadgeVariant,
  getStatusLabel,
} from "../../constants/statusLabels";
import { getSubmissionItemLabel } from "../../constants/submissionItemLabels";
import { formatDateTime } from "../../utils/dateTime";
export default function SubmissionHistoryPage() {
  const { id } = useParams(),
    location = useLocation(),
    [data, setData] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const request = location.pathname.includes("/progress/")
      ? currentSubmission(id)
      : studentSubmission(id);
    void request
      .then((r) => {
        if (active)
          setData(
            r.data?.requirement
              ? r.data
              : {
                  requirement: { title: r.data.requirementTitle },
                  attempts: r.data.attempts || [],
                },
          );
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id, location.pathname]);
  const download = async (response) => {
    const blob = await downloadSubmissionFile(response.fileId, "student"),
      url = URL.createObjectURL(blob),
      anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = response.originalName || "bao-cao";
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="workflow-page">
      <div className="page-title">
        <h2>Lịch sử tiến độ tuần</h2>
        <p>{data?.requirement?.title}</p>
      </div>
      {error && <div className="alert error">{error}</div>}
      {!data ? (
        <div className="panel">Đang tải...</div>
      ) : (
        <div className="progress-timeline">
          {data.attempts.map((attempt) => (
            <article className="panel" key={attempt.id}>
              <div className="row-between">
                <h3>Lần nộp {attempt.attemptNumber}</h3>
                <span
                  className={`status-badge ${getStatusBadgeVariant(attempt.status)}`}
                >
                  {getStatusLabel(attempt.status)}
                </span>
              </div>
              <p>
                {formatDateTime(attempt.submittedAt)} ·{" "}
                {attempt.isLate ? "Nộp trễ" : "Đúng hạn"}
              </p>
              {attempt.responses?.map((item) => (
                <div className="response-item" key={item.id}>
                  <strong>
                    {getSubmissionItemLabel(item.type) || item.name}
                  </strong>
                  {item.textValue && <p>{item.textValue}</p>}
                  {item.urlValue && (
                    <a
                      href={item.urlValue}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.urlValue}
                    </a>
                  )}
                  {item.fileId && (
                    <button onClick={() => download(item)}>
                      Tải xuống {item.originalName}
                    </button>
                  )}
                </div>
              ))}
            </article>
          ))}
          {!data.attempts.length && (
            <div className="panel empty-state">Chưa có lần nộp nào.</div>
          )}
        </div>
      )}
    </div>
  );
}
