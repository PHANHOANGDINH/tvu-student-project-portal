import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Paperclip, Trash2, UploadCloud } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import CourseClassSelect from "../../components/CourseClassSelect";
import { listLecturerTopics } from "../../api/groupsApi";
import {
  createTopicRound,
  deleteRoundFile,
  downloadRoundFile,
  listLecturerTopicRounds,
  listRoundFiles,
  updateTopicRound,
  updateTopicRoundStatus,
  uploadRoundFile,
} from "../../api/topicRoundsApi";
import {
  getStatusBadgeVariant,
  getStatusLabel,
} from "../../constants/statusLabels";
import { formatDateRange, formatDateTime } from "../../utils/dateTime";

const blank = {
  classId: "",
  name: "",
  description: "",
  requirements: "",
  startAt: "",
  endAt: "",
  allowEditing: true,
  maxEditCount: 3,
};
const allowedExtensions = ["pdf", "doc", "docx"];
const fileType = (file) => file.name.split(".").pop()?.toUpperCase() || "TỆP";
const fileSize = (size) =>
  size < 1024 * 1024
    ? `${Math.ceil(size / 1024)} KB`
    : `${(size / 1024 / 1024).toFixed(1)} MB`;

export default function TopicRoundsPage() {
  const { id } = useParams(),
    location = useLocation(),
    navigate = useNavigate();
  const formMode =
    location.pathname.endsWith("/new") || location.pathname.endsWith("/edit");
  const [items, setItems] = useState([]),
    [form, setForm] = useState(blank),
    [files, setFiles] = useState([]),
    [pendingFiles, setPendingFiles] = useState([]),
    [registrations, setRegistrations] = useState([]);
  const [classId, setClassId] = useState(""),
    [statusFilter, setStatusFilter] = useState(""),
    [tab, setTab] = useState("overview"),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [progressText, setProgressText] = useState(""),
    [createdId, setCreatedId] = useState(null);
  const selected = items.find((item) => String(item.id) === String(id));
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rounds = (await listLecturerTopicRounds()).data || [];
      setItems(rounds);
      if (id) {
        const current = rounds.find((item) => String(item.id) === String(id));
        if (current && formMode)
          setForm({
            ...current,
            startAt: String(current.startAt).slice(0, 16),
            endAt: String(current.endAt).slice(0, 16),
          });
        setFiles((await listRoundFiles("lecturer", id)).data || []);
        setRegistrations(
          ((await listLecturerTopics()).data || []).filter(
            (item) => String(item.roundId) === String(id),
          ),
        );
      }
      setError("");
    } catch {
      setError("Không thể tải dữ liệu vòng đăng ký. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [formMode, id]);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (!classId || String(item.classId) === classId) &&
          (!statusFilter || item.status === statusFilter),
      ),
    [items, classId, statusFilter],
  );
  const addFiles = (fileList) => {
    const incoming = [...fileList],
      invalid = incoming.find(
        (file) =>
          !allowedExtensions.includes(
            file.name.split(".").pop()?.toLowerCase(),
          ) || file.size > 20 * 1024 * 1024,
      );
    if (invalid) {
      setError(`Tệp ${invalid.name} không đúng định dạng hoặc vượt quá 20 MB.`);
      return;
    }
    setPendingFiles((current) => [
      ...current,
      ...incoming.map((file) => ({ file, status: "waiting" })),
    ]);
  };
  const save = async (event, openAfter = false) => {
    event.preventDefault();
    if (busy || createdId) return;
    setBusy(true);
    setError("");
    try {
      setProgressText(id ? "Đang lưu thay đổi..." : "Đang tạo đợt đăng ký...");
      const saved = id
        ? (await updateTopicRound(id, form)).data
        : (await createTopicRound(form)).data;
      const roundId = id || saved?.id;
      if (!roundId) throw new Error("Không nhận được mã vòng đăng ký.");
      for (let index = 0; index < pendingFiles.length; index += 1) {
        setProgressText(
          `Đang tải tài liệu ${index + 1}/${pendingFiles.length}...`,
        );
        setPendingFiles((current) =>
          current.map((item, i) =>
            i === index ? { ...item, status: "uploading" } : item,
          ),
        );
        try {
          await uploadRoundFile(roundId, pendingFiles[index].file);
          setPendingFiles((current) =>
            current.map((item, i) =>
              i === index ? { ...item, status: "success" } : item,
            ),
          );
        } catch (cause) {
          setPendingFiles((current) =>
            current.map((item, i) =>
              i === index ? { ...item, status: "error" } : item,
            ),
          );
          setCreatedId(roundId);
          throw new Error(
            `Không thể tải tệp ${pendingFiles[index].file.name}. Vòng đăng ký được giữ ở Bản nháp.`,
          { cause },
          );
        }
      }
      if (openAfter) {
        setProgressText("Đang mở đăng ký...");
        await updateTopicRoundStatus(roundId, "OPEN");
      }
      navigate(`/lecturer/topic-registration-rounds/${roundId}`);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
      setProgressText("");
    }
  };
  const changeStatus = async (next) => {
    try {
      setError("");
      await updateTopicRoundStatus(id, next);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };
  const uploadExisting = async (event) => {
    const selectedFiles = [...(event.target.files || [])];
    if (!selectedFiles.length) return;
    setBusy(true);
    try {
      for (const file of selectedFiles) await uploadRoundFile(id, file);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };
  if (formMode)
    return (
      <div className="workflow-page">
        <div className="page-title">
          <h2>{id ? "Chỉnh sửa vòng đăng ký" : "Tạo vòng đăng ký đề tài"}</h2>
          <p>Cấu hình lớp, nội dung, thời gian và tài liệu hướng dẫn.</p>
        </div>
        {error && (
          <div className="alert error">
            <span>{error}</span>
            <button onClick={() => setError("")}>×</button>
          </div>
        )}
        <form
          className="panel workflow-form round-form"
          onSubmit={(event) => save(event, false)}
        >
          <CourseClassSelect
            role="LECTURER"
            value={String(form.classId || "")}
            onChange={(value) => setForm({ ...form, classId: value })}
          />
          <label>
            Tiêu đề
            <input
              required
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Mô tả
            <textarea
              value={form.description || ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </label>
          <label>
            Yêu cầu đề tài
            <textarea
              value={form.requirements || ""}
              onChange={(e) =>
                setForm({ ...form, requirements: e.target.value })
              }
            />
          </label>
          <div className="builder-grid three">
            <label>
              Thời gian mở<small>Ngày và giờ bắt đầu đăng ký</small>
              <input
                type="datetime-local"
                required
                value={form.startAt || ""}
                onChange={(e) => setForm({ ...form, startAt: e.target.value })}
              />
            </label>
            <label>
              Thời gian đóng<small>Ngày và giờ kết thúc đăng ký</small>
              <input
                type="datetime-local"
                required
                value={form.endAt || ""}
                onChange={(e) => setForm({ ...form, endAt: e.target.value })}
              />
            </label>
            <label>
              Số lần chỉnh sửa tối đa
              <input
                type="number"
                min="0"
                max="20"
                value={form.maxEditCount || 0}
                onChange={(e) =>
                  setForm({ ...form, maxEditCount: Number(e.target.value) })
                }
              />
            </label>
          </div>
          <label className="switch-label">
            <input
              type="checkbox"
              checked={form.allowEditing !== false}
              onChange={(e) =>
                setForm({ ...form, allowEditing: e.target.checked })
              }
            />{" "}
            Cho phép chỉnh sửa khi được yêu cầu
          </label>
          {!id && (
            <section className="attachment-section">
              <div className="section-heading">
                <div>
                  <h3>Tài liệu hướng dẫn</h3>
                  <p>
                    Đính kèm đề cương, mẫu thuyết minh hoặc tài liệu yêu cầu
                    dành cho sinh viên.
                  </p>
                </div>
              </div>
              <label
                className="round-dropzone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  addFiles(e.dataTransfer.files);
                }}
              >
                <UploadCloud size={34} />
                <strong>Kéo thả tệp vào đây</strong>
                <span>hoặc</span>
                <span className="btn-light">Chọn tệp từ máy tính</span>
                <small>PDF, DOC, DOCX · tối đa 20 MB mỗi tệp</small>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => addFiles(e.target.files || [])}
                />
              </label>
              <div className="pending-file-list">
                {pendingFiles.map((item, index) => (
                  <div key={`${item.file.name}-${index}`}>
                    <FileText />
                    <span>
                      <strong>{item.file.name}</strong>
                      <small>
                        {fileType(item.file)} · {fileSize(item.file.size)}
                      </small>
                    </span>
                    <em className={`upload-state ${item.status}`}>
                      {item.status === "waiting"
                        ? "Chờ tải lên"
                        : item.status === "uploading"
                          ? "Đang tải..."
                          : item.status === "success"
                            ? "Thành công"
                            : "Thất bại"}
                    </em>
                    <button
                      type="button"
                      disabled={busy}
                      aria-label="Xóa khỏi danh sách"
                      onClick={() =>
                        setPendingFiles((current) =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
          {createdId && (
            <button
              type="button"
              className="btn-light"
              onClick={() =>
                navigate(`/lecturer/topic-registration-rounds/${createdId}`)
              }
            >
              Xem bản nháp đã tạo
            </button>
          )}
          <div className="form-actions builder-actions">
            <button
              type="button"
              className="btn-light"
              disabled={busy}
              onClick={() => navigate(-1)}
            >
              Hủy
            </button>
            <button disabled={busy || createdId} className="btn-light">
              {progressText || "Lưu bản nháp"}
            </button>
            {!id && (
              <button
                type="button"
                disabled={busy || createdId}
                className="btn-primary"
                onClick={(event) => save(event, true)}
              >
                {progressText || "Lưu và mở đăng ký"}
              </button>
            )}
          </div>
        </form>
      </div>
    );
  if (id && selected)
    return (
      <div className="workflow-page">
        <div className="page-title row-between">
          <div>
            <h2>{selected.name}</h2>
            <p>
              {selected.classCode} ·{" "}
              {formatDateRange(selected.startAt, selected.endAt)}
            </p>
          </div>
          <div className="form-actions">
            <button
              className="btn-light"
              onClick={() =>
                navigate(`/lecturer/topic-registration-rounds/${id}/edit`)
              }
            >
              Chỉnh sửa
            </button>
            {selected.status === "DRAFT" && (
              <button
                className="btn-primary"
                onClick={() => changeStatus("OPEN")}
              >
                Mở đăng ký
              </button>
            )}
            {selected.status === "OPEN" && (
              <button onClick={() => changeStatus("CLOSED")}>Đóng</button>
            )}
            {!["CLOSED", "CANCELLED"].includes(selected.status) && (
              <button onClick={() => changeStatus("CANCELLED")}>Hủy</button>
            )}
          </div>
        </div>
        {error && <div className="alert error">{error}</div>}
        <div className="workflow-tabs">
          {[
            ["overview", "Tổng quan"],
            ["files", "Tài liệu hướng dẫn"],
            ["registrations", "Danh sách đăng ký"],
            ["settings", "Cấu hình và thời gian"],
          ].map(([key, label]) => (
            <button
              className={tab === key ? "active" : ""}
              onClick={() => setTab(key)}
              key={key}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "overview" && (
          <div className="panel workflow-detail-grid">
            <div>
              <small>Lớp học phần</small>
              <strong>
                {selected.classCode} — {selected.className}
              </strong>
            </div>
            <div>
              <small>Trạng thái</small>
              <span
                className={`status-badge ${getStatusBadgeVariant(selected.status)}`}
              >
                {getStatusLabel(selected.status)}
              </span>
            </div>
            <div>
              <small>Nhóm đã đăng ký</small>
              <strong>{selected.registrationCount || 0}</strong>
            </div>
            <div>
              <small>Chờ duyệt</small>
              <strong>{selected.pendingCount || 0}</strong>
            </div>
            <section>
              <h3>Mô tả</h3>
              <p>{selected.description || "Chưa có mô tả."}</p>
              <h3>Yêu cầu đề tài</h3>
              <p>{selected.requirements || "Chưa có yêu cầu bổ sung."}</p>
            </section>
          </div>
        )}
        {tab === "files" && (
          <div className="panel">
            <label className="round-dropzone">
              <Paperclip />
              <strong>
                {busy ? "Đang tải lên..." : "Kéo thả hoặc chọn PDF, DOC, DOCX"}
              </strong>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                disabled={busy || selected.status !== "DRAFT"}
                onChange={uploadExisting}
              />
            </label>
            <div className="file-list">
              {files.map((file) => (
                <div key={file.id}>
                  <span>
                    <strong>{file.originalName}</strong>
                    <small>
                      {fileSize(file.sizeBytes)} ·{" "}
                      {formatDateTime(file.createdAt)}
                    </small>
                  </span>
                  <button
                    onClick={() =>
                      downloadRoundFile("lecturer", file.id, file.originalName)
                    }
                  >
                    Tải xuống
                  </button>
                  {selected.status === "DRAFT" && (
                    <button
                      onClick={async () => {
                        await deleteRoundFile(file.id);
                        await load();
                      }}
                    >
                      Xóa
                    </button>
                  )}
                </div>
              ))}
              {!files.length && <p>Chưa có tài liệu hướng dẫn.</p>}
            </div>
          </div>
        )}
        {tab === "registrations" && (
          <div className="panel table-wrap">
            {registrations.length ? (
              <table>
                <thead>
                  <tr>
                    <th>Nhóm</th>
                    <th>Đề tài</th>
                    <th>Thời gian gửi</th>
                    <th>Lần sửa</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((item) => (
                    <tr key={item.id}>
                      <td>{item.groupName}</td>
                      <td>{item.title}</td>
                      <td>{formatDateTime(item.createdAt)}</td>
                      <td>{item.revisionCount || 0}</td>
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
                            navigate(
                              `/lecturer/topic-registration-rounds/${id}/registrations/${item.id}`,
                            )
                          }
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <h3>Chưa có nhóm đăng ký.</h3>
              </div>
            )}
          </div>
        )}
        {tab === "settings" && (
          <div className="panel settings-list">
            <p>
              <strong>Cho phép chỉnh sửa:</strong>{" "}
              {selected.allowEditing ? "Có" : "Không"}
            </p>
            <p>
              <strong>Số lần chỉnh sửa tối đa:</strong> {selected.maxEditCount}
            </p>
            <p>
              <strong>Thời gian:</strong>{" "}
              {formatDateRange(selected.startAt, selected.endAt)}
            </p>
          </div>
        )}
      </div>
    );
  return (
    <div className="workflow-page">
      <div className="page-title row-between">
        <div>
          <h2>Vòng đăng ký đề tài</h2>
          <p>Quản lý các đợt đăng ký theo lớp học phần.</p>
        </div>
        <button
          className="btn-primary compact-button"
          onClick={() => navigate("/lecturer/topic-registration-rounds/new")}
        >
          Tạo vòng đăng ký
        </button>
      </div>
      {error && <div className="alert error">{error}</div>}
      <div className="panel workflow-filter">
        <CourseClassSelect
          role="LECTURER"
          value={classId}
          onChange={setClassId}
        />
        <label>
          Trạng thái
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            {["DRAFT", "OPEN", "CLOSED", "CANCELLED"].map((value) => (
              <option value={value} key={value}>
                {getStatusLabel(value)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {loading ? (
        <div className="panel">Đang tải...</div>
      ) : (
        <div className="workflow-card-grid">
          {filtered.map((item) => (
            <button
              className="workflow-card"
              key={item.id}
              onClick={() =>
                navigate(`/lecturer/topic-registration-rounds/${item.id}`)
              }
            >
              <span
                className={`status-badge ${getStatusBadgeVariant(item.status)}`}
              >
                {getStatusLabel(item.status)}
              </span>
              <h3>{item.name}</h3>
              <p>
                {item.classCode} — {item.className}
              </p>
              <small>{formatDateRange(item.startAt, item.endAt)}</small>
              <div>
                <strong>{item.registrationCount || 0}</strong> nhóm ·{" "}
                <strong>{item.pendingCount || 0}</strong> chờ duyệt
              </div>
            </button>
          ))}
          {!filtered.length && (
            <div className="panel empty-state">
              Chưa có vòng đăng ký phù hợp.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
