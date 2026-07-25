import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  Link2,
  MessageSquareText,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  changeReviewStatus,
  getReview,
  saveFeedback,
  saveGrade,
} from "../../api/gradingApi";
import { downloadSubmissionFile } from "../../api/submissionsApi";
import {
  getStatusBadgeVariant,
  getStatusLabel,
} from "../../constants/statusLabels";
import { getSubmissionItemLabel } from "../../constants/submissionItemLabels";
import { formatDateTime } from "../../utils/dateTime";
const NOT_FOUND = "Không tìm thấy bài nộp hoặc bạn không có quyền truy cập";
const size = (value) => `${(Number(value || 0) / 1024 / 1024).toFixed(2)} MB`;
export default function SubmissionReviewPage() {
  const { id } = useParams(),
    navigate = useNavigate(),
    submissionId = Number(id),
    validId = Number.isInteger(submissionId) && submissionId > 0;
  const [data, setData] = useState(null),
    [comment, setComment] = useState(""),
    [revision, setRevision] = useState(false),
    [reason, setReason] = useState(""),
    [scores, setScores] = useState({}),
    [total, setTotal] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
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
            (review.grade?.scores ?? []).map((item) => [
              item.criterionId,
              item.score,
            ]),
          ),
        );
      } catch (requestError) {
        if (active()) {
          setData(null);
          setError(
            [403, 404].includes(requestError.status)
              ? NOT_FOUND
              : requestError.message || "Không thể tải bài nộp.",
          );
        }
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
    () =>
      Object.values(scores).reduce(
        (value, score) => value + (Number(score) || 0),
        0,
      ),
    [scores],
  );
  const latest = (data?.attempts ?? [])[0];
  const act = async (action) => {
    try {
      setError("");
      await action();
      await load();
    } catch (actionError) {
      if (mountedRef.current)
        setError(actionError.message || "Không thể thực hiện thao tác.");
    }
  };
  const download = async (file) => {
    try {
      setError("");
      const blob = await downloadSubmissionFile(file.id, "lecturer"),
        url = URL.createObjectURL(blob),
        anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.originalName || `submission-file-${file.id}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      if (mountedRef.current)
        setError(downloadError.message || "Không thể tải tệp.");
    }
  };
  const grade = (publish) => {
    const criteria = data.criteria ?? [],
      body = criteria.length
        ? {
            scores: criteria.map((item) => ({
              criterionId: item.id,
              score: Number(scores[item.id] || 0),
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
          <button className="btn-primary" onClick={() => void load()}>
            Thử lại
          </button>
          <button onClick={() => navigate("/lecturer/submissions")}>
            Quay lại danh sách bài nộp
          </button>
        </div>
      </div>
    );
  return (
    <div className="workflow-page submission-review">
      <div className="page-title">
        <h2>Chấm bài: {data.groupName}</h2>
        <p>
          {data.requirementTitle} · {data.classCode}
        </p>
        {data.topicTitle && (
          <p>
            Đề tài: <strong>{data.topicTitle}</strong>
          </p>
        )}
      </div>
      {error && (
        <div className="alert error">
          <span>{error}</span>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}
      <section className="panel">
        <div className="section-heading">
          <div>
            <h3>Thông tin bài nộp</h3>
            <p>Tổng quan về nhóm và lần nộp gần nhất.</p>
          </div>
          <span
            className={`status-badge ${getStatusBadgeVariant(data.status)}`}
          >
            {getStatusLabel(data.status)}
          </span>
        </div>
        <div className="review-info-grid">
          <div>
            <small>Nhóm</small>
            <strong>{data.groupName}</strong>
          </div>
          <div>
            <small>Lớp học phần</small>
            <strong>{data.classCode}</strong>
          </div>
          <div>
            <small>Tuần hoặc yêu cầu</small>
            <strong>{data.requirementTitle}</strong>
          </div>
          <div>
            <small>Thời gian nộp</small>
            <strong>
              {latest?.submittedAt
                ? formatDateTime(latest.submittedAt)
                : "Chưa nộp"}
            </strong>
          </div>
          <div>
            <small>Số lần nộp</small>
            <strong>{data.attempts?.length || 0}</strong>
          </div>
          <div>
            <small>Trạng thái</small>
            <strong>{getStatusLabel(data.status)}</strong>
          </div>
        </div>
      </section>
      <section className="panel">
        <div className="section-heading">
          <div>
            <h3>Nội dung sinh viên đã nộp</h3>
            <p>Các nội dung được sắp theo từng lần nộp, mới nhất trước.</p>
          </div>
        </div>
        <div className="attempt-list">
          {(data.attempts ?? []).map((attempt) => (
            <article className="attempt-card" key={attempt.id}>
              <div className="attempt-heading">
                <div>
                  <strong>Lần nộp {attempt.attemptNumber}</strong>
                  <small>{formatDateTime(attempt.submittedAt)}</small>
                </div>
                <span
                  className={`status-badge ${getStatusBadgeVariant(attempt.status)}`}
                >
                  {getStatusLabel(attempt.status)}
                </span>
              </div>
              <div className="submitted-content-list">
                {(attempt.responses ?? []).map((item) => (
                  <div className="submitted-item" key={item.id}>
                    {item.urlValue ? <Link2 /> : <MessageSquareText />}
                    <div>
                      <strong>
                        {getSubmissionItemLabel(item.type || item.itemType) ||
                          item.name}
                      </strong>
                      {item.textValue && <p>{item.textValue}</p>}
                      {item.urlValue && (
                        <div className="link-action">
                          <a
                            href={item.urlValue}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {item.urlValue}
                          </a>
                          <a
                            className="btn-light"
                            href={item.urlValue}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink size={16} /> Mở liên kết
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {(attempt.links ?? []).map((link) => (
                  <div className="submitted-item" key={link.id}>
                    <Link2 />
                    <div>
                      <strong>{getSubmissionItemLabel(link.type)}</strong>
                      <div className="link-action">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {link.url}
                        </a>
                        <a
                          className="btn-light"
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink size={16} /> Mở liên kết
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
                {(attempt.files ?? []).map((file) => (
                  <div className="submitted-item" key={file.id}>
                    <FileText />
                    <div>
                      <strong>{getSubmissionItemLabel(file.type)}</strong>
                      <p>
                        {file.originalName} · {size(file.size)}
                      </p>
                    </div>
                    <button
                      className="btn-light"
                      onClick={() => void download(file)}
                    >
                      <Download size={16} /> Tải xuống
                    </button>
                  </div>
                ))}
              </div>
            </article>
          ))}
          {!(data.attempts ?? []).length && (
            <div className="empty-state">Chưa có lần nộp nào.</div>
          )}
        </div>
      </section>
      <section className="panel">
        <div className="section-heading">
          <div>
            <h3>Lịch sử xem xét</h3>
            <p>Các thay đổi trạng thái và nhận xét của giảng viên.</p>
          </div>
        </div>
        <div className="review-timeline">
          {(data.history ?? []).map((item) => (
            <article key={item.id}>
              <i />
              <div>
                <small>{formatDateTime(item.createdAt)}</small>
                <div className="status-transition">
                  <span
                    className={`status-badge ${getStatusBadgeVariant(item.fromStatus)}`}
                  >
                    {getStatusLabel(item.fromStatus)}
                  </span>
                  <strong>→</strong>
                  <span
                    className={`status-badge ${getStatusBadgeVariant(item.toStatus)}`}
                  >
                    {getStatusLabel(item.toStatus)}
                  </span>
                </div>
                {item.comment && <p>{item.comment}</p>}
                {item.actorName && (
                  <small>Thực hiện bởi {item.actorName}</small>
                )}
              </div>
            </article>
          ))}
          {!(data.history ?? []).length && <p>Chưa có lịch sử xem xét.</p>}
        </div>
      </section>
      <section className="panel">
        <div className="form-actions review-actions">
          <button
            onClick={() =>
              void act(() => changeReviewStatus(submissionId, "UNDER_REVIEW"))
            }
          >
            Bắt đầu xem xét
          </button>
          <button
            onClick={() =>
              void act(() => changeReviewStatus(submissionId, "COMPLETED"))
            }
          >
            Xác nhận hoàn thành
          </button>
          <button
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
        <label className="switch-label">
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
      </section>
      <section className="panel">
        <h3>Chấm điểm</h3>
        {(data.criteria ?? []).length ? (
          data.criteria.map((item) => (
            <label key={item.id}>
              {item.name} (tối đa {item.maxScore})
              <input
                type="number"
                min="0"
                max={item.maxScore}
                step="0.01"
                value={scores[item.id] ?? ""}
                onChange={(e) =>
                  setScores({ ...scores, [item.id]: e.target.value })
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
        <div className="form-actions">
          <button onClick={() => grade(false)}>Lưu nháp</button>
          <button className="btn-primary" onClick={() => grade(true)}>
            Công bố
          </button>
        </div>
      </section>
    </div>
  );
}
