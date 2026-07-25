import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  changeReviewStatus,
  getReview,
  saveFeedback,
  saveGrade,
} from "../../api/gradingApi";
import { downloadSubmissionFile } from "../../api/submissionsApi";

const NOT_FOUND = "Không tìm thấy bài nộp hoặc bạn không có quyền truy cập";

export default function SubmissionReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const submissionId = Number(id);
  const validId = Number.isInteger(submissionId) && submissionId > 0;
  const [data, setData] = useState(null);
  const [comment, setComment] = useState("");
  const [revision, setRevision] = useState(false);
  const [reason, setReason] = useState("");
  const [scores, setScores] = useState({});
  const [total, setTotal] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const mountedRef = useRef(true);

  const load = useCallback(
    async ({ active = () => mountedRef.current, showLoading = true } = {}) => {
      if (showLoading && active()) setLoading(true);
      if (active()) setError("");
      if (!validId) {
        if (active()) {
          setData(null);
          setError(NOT_FOUND);
          setLoading(false);
        }
        return;
      }
      try {
        const response = await getReview(submissionId);
        if (!active()) return;
        const review = response.data;
        setData(review);
        setComment(review.feedback?.comment || "");
        setRevision(Boolean(review.feedback?.revisionRequired));
        setReason(review.feedback?.revisionReason || "");
        setTotal(
          review.grade?.usesCriteria ? "" : (review.grade?.totalScore ?? ""),
        );
        setScores(
          Object.fromEntries(
            (review.grade?.scores ?? []).map((x) => [x.criterionId, x.score]),
          ),
        );
      } catch (requestError) {
        if (!active()) return;
        setData(null);
        setError(
          [403, 404].includes(requestError.status)
            ? NOT_FOUND
            : requestError.message || "Không thể tải bài nộp.",
        );
      } finally {
        if (active()) setLoading(false);
      }
    },
    [submissionId, validId],
  );

  useEffect(() => {
    mountedRef.current = true;
    let mounted = true;
    void Promise.resolve().then(() =>
      load({ active: () => mounted, showLoading: false }),
    );
    return () => {
      mounted = false;
      mountedRef.current = false;
    };
  }, [load]);

  const sum = useMemo(
    () => Object.values(scores).reduce((n, x) => n + (Number(x) || 0), 0),
    [scores],
  );
  const act = async (action) => {
    try {
      setError("");
      await action();
      await load();
    } catch (actionError) {
      setError(actionError.message || "Không thể thực hiện thao tác.");
    }
  };
  const download = async (file) => {
    try {
      setError("");
      const blob = await downloadSubmissionFile(file.id, "lecturer");
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.originalName || `submission-file-${file.id}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError.message || "Không thể tải file.");
    }
  };
  const grade = (publish) => {
    const criteria = data.criteria ?? [];
    const body = criteria.length
      ? {
          scores: criteria.map((c) => ({
            criterionId: c.id,
            score: Number(scores[c.id] || 0),
          })),
          isPublished: publish,
        }
      : { totalScore: Number(total), isPublished: publish };
    if (publish && !window.confirm("Công bố kết quả cho sinh viên?")) return;
    void act(() => saveGrade(submissionId, body));
  };

  if (loading) return <div className="panel">Đang tải bài nộp...</div>;
  if (!data)
    return (
      <div className="panel">
        <div className="alert error">{error || NOT_FOUND}</div>
        <div className="form-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => void load()}
          >
            Thử lại
          </button>
          <button
            type="button"
            onClick={() => navigate("/lecturer/submissions")}
          >
            Quay lại danh sách bài nộp
          </button>
        </div>
      </div>
    );

  return (
    <div>
      <div className="page-title">
        <h2>Chấm bài: {data.groupName}</h2>
        <p>
          {data.requirementTitle} · {data.classCode} · {data.status}
        </p>
        {data.topicTitle && (
          <p>
            Đề tài: <strong>{data.topicTitle}</strong>
          </p>
        )}
      </div>
      {error && <div className="alert error">{error}</div>}
      <div className="panel">
        <h3>Lịch sử bài nộp</h3>
        {(data.attempts ?? []).map((a) => (
          <div key={a.id}>
            <p>
              <strong>
                Lần {a.attemptNumber} · {a.status}
              </strong>{" "}
              · Mã lần nộp: {a.id}
              {a.submittedAt &&
                ` · ${new Date(a.submittedAt).toLocaleString("vi-VN")}`}
            </p>
            {(a.files ?? []).map((f) => (
              <div className="form-actions" key={f.id}>
                <small>
                  {f.type}: {f.originalName} (
                  {(Number(f.size || 0) / 1024 / 1024).toFixed(2)} MB)
                </small>
                <button type="button" onClick={() => void download(f)}>
                  Tải file
                </button>
              </div>
            ))}
            {(a.links ?? []).map((l) => (
              <p key={l.id}>
                <a href={l.url} target="_blank" rel="noopener noreferrer">
                  {l.type}: {l.url}
                </a>
              </p>
            ))}
            {(a.responses ?? []).map((x) => (
              <div className="response-item" key={x.id}>
                <strong>{x.name}</strong>
                {x.textValue && <p>{x.textValue}</p>}
                {x.urlValue && (
                  <a
                    href={x.urlValue}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {x.urlValue}
                  </a>
                )}
                {x.originalName && <small>{x.originalName}</small>}
              </div>
            ))}
          </div>
        ))}
        {!(data.attempts ?? []).length && <p>Chưa có lần nộp nào.</p>}
      </div>
      <div className="panel">
        <h3>Lịch sử xem xét</h3>
        {(data.history ?? []).map((x) => (
          <div className="response-item" key={x.id}>
            <strong>{x.action || x.status || "Cập nhật"}</strong>
            {(x.fromStatus || x.toStatus) && (
              <p>
                {x.fromStatus || "?"} ? {x.toStatus || "?"}
              </p>
            )}
            {x.comment && <p>{x.comment}</p>}
            {x.createdAt && (
              <small>{new Date(x.createdAt).toLocaleString("vi-VN")}</small>
            )}
          </div>
        ))}
        {!(data.history ?? []).length && <p>Chưa có lịch sử xem xét.</p>}
      </div>
      <div className="panel">
        <div className="form-actions">
          <button
            type="button"
            onClick={() =>
              void act(() => changeReviewStatus(submissionId, "UNDER_REVIEW"))
            }
          >
            Bắt đầu xem xét
          </button>
          <button
            type="button"
            onClick={() =>
              void act(() => changeReviewStatus(submissionId, "COMPLETED"))
            }
          >
            Xác nhận hoàn thành
          </button>
          <button
            type="button"
            onClick={() => {
              const value = window.prompt("Nhập lý do yêu cầu chỉnh sửa:");
              if (value)
                void act(() =>
                  changeReviewStatus(submissionId, "REQUIRES_REVISION", value),
                );
            }}
          >
            Yêu cầu chỉnh sửa
          </button>
          <button
            type="button"
            onClick={() => {
              const value = window.prompt("Nhập lý do chưa đạt:");
              if (value)
                void act(() =>
                  changeReviewStatus(submissionId, "NOT_MET", value),
                );
            }}
          >
            Đánh dấu chưa đạt
          </button>
        </div>
        <h3>Nhận xét</h3>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Nhận xét chung"
        />
        <label>
          <input
            type="checkbox"
            checked={revision}
            onChange={(e) => setRevision(e.target.checked)}
          />{" "}
          Yêu cầu chỉnh sửa
        </label>
        {revision && (
          <textarea
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Lý do chỉnh sửa"
          />
        )}
        <button
          type="button"
          onClick={() =>
            void act(() =>
              saveFeedback(submissionId, {
                comment,
                revisionRequired: revision,
                revisionReason: reason,
              }),
            )
          }
        >
          Lưu nhận xét
        </button>
      </div>
      <div className="panel">
        <h3>Chấm điểm</h3>
        {(data.criteria ?? []).length ? (
          data.criteria.map((c) => (
            <label key={c.id}>
              {c.name} (tối đa {c.maxScore})
              <input
                type="number"
                min="0"
                max={c.maxScore}
                step="0.01"
                value={scores[c.id] ?? ""}
                onChange={(e) =>
                  setScores({ ...scores, [c.id]: e.target.value })
                }
              />
            </label>
          ))
        ) : (
          <label>
            Điểm tổng / 10
            <input
              type="number"
              min="0"
              max="10"
              step="0.01"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
            />
          </label>
        )}
        <p>
          <strong>
            Tổng điểm: {(data.criteria ?? []).length ? sum : total || 0}/10
          </strong>
        </p>
        <button type="button" onClick={() => grade(false)}>
          Lưu nháp
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => grade(true)}
        >
          Công bố
        </button>
      </div>
    </div>
  );
}
