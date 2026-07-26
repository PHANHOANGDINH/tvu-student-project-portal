import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getStudentResult } from "../../api/gradingApi";
import { getStatusLabel } from "../../constants/statusLabels";

const EVENT_LABELS = {
  STATUS_CHANGED: "Cập nhật trạng thái",
  REVISION_REQUESTED: "Yêu cầu chỉnh sửa",
  GRADE_PUBLISHED: "Công bố điểm",
};

export default function SubmissionResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getStudentResult(id).then(response => setData(response.data)).catch(cause => setError(cause.message));
  }, [id]);

  return (
    <div>
      <div className="page-title">
        <h2>Kết quả bài nộp</h2>
        <p>{data && `${data.groupName} · ${data.requirementTitle}`}</p>
      </div>
      {error && <div className="alert error">{error}</div>}
      {!data ? <div className="panel">Đang tải...</div> : <>
        <div className="panel">
          <h3>{data.grade ? `Điểm: ${data.grade.totalScore}/${data.grade.maxScore}` : "Điểm chưa được công bố"}</h3>
          {data.feedback?.comment && <p><strong>Nhận xét:</strong> {data.feedback.comment}</p>}
          {data.feedback?.revisionRequired && <div className="alert error"><strong>Yêu cầu chỉnh sửa:</strong> {data.feedback.revisionReason}</div>}
          {data.grade?.scores?.map(item => <p key={item.criterionId}>{item.name}: {item.score}/{item.maxScore}{item.comment ? ` · ${item.comment}` : ""}</p>)}
        </div>
        {data.canResubmit && <button className="btn-primary" onClick={() => navigate(`/student/submission-requirements/${data.requirementId}/submit`)}>Nộp lại bài</button>}
        <div className="panel">
          <h3>Lịch sử review</h3>
          {data.history.map(item => (
            <p key={item.id}>
              {new Date(item.createdAt).toLocaleString("vi-VN")} · {EVENT_LABELS[item.eventType] || "Cập nhật bài nộp"} · {getStatusLabel(item.toStatus)}
              {item.comment ? ` · ${item.comment}` : ""}
            </p>
          ))}
        </div>
      </>}
    </div>
  );
}
