import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Link2,
  Paperclip,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import CourseClassSelect from "../../components/CourseClassSelect";
import {
  changeRequirementStatus,
  createRequirement,
  deleteRequirement,
  listLecturerRequirements,
  updateRequirement,
} from "../../api/submissionRequirementsApi";
import {
  getStatusBadgeVariant,
  getStatusLabel,
} from "../../constants/statusLabels";
import {
  SUBMISSION_ITEM_GROUPS,
  SUBMISSION_ITEM_TYPES,
  getSubmissionItemDescription,
  getSubmissionItemGroup,
  getSubmissionItemLabel,
} from "../../constants/submissionItemLabels";
import { formatDateRange } from "../../utils/dateTime";

const blank = {
  classId: "",
  requirementType: "WEEKLY_PROGRESS",
  weekNumber: "",
  title: "",
  description: "",
  instructions: "",
  startAt: "",
  deadline: "",
  allowLate: false,
  allowResubmission: true,
  maxAttempts: 3,
  maxFileSizeMb: 20,
  requiredItems: [],
};
const icons = { report: FileText, link: Link2, file: Paperclip };
const normalizeItems = (items = []) =>
  items.map((item, index) => ({
    ...item,
    type: item.type,
    isRequired: item.isRequired !== false,
    displayOrder: index + 1,
  }));

export default function SubmissionRequirementsPage() {
  const location = useLocation(),
    navigate = useNavigate(),
    routeCreate = location.pathname.endsWith("/new");
  const [items, setItems] = useState([]),
    [form, setForm] = useState(blank),
    [editing, setEditing] = useState(null);
  const [show, setShow] = useState(routeCreate),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems((await listLecturerRequirements()).data || []);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
  const open = (item) => {
    setEditing(item || null);
    setForm(
      item
        ? {
            ...item,
            startAt: String(item.startAt).slice(0, 16),
            deadline: String(item.deadline).slice(0, 16),
            requiredItems: normalizeItems(item.requiredItems),
          }
        : blank,
    );
    setShow(true);
  };
  const close = () => {
    setShow(false);
    setEditing(null);
    if (routeCreate) navigate("/lecturer/progress-requirements");
  };
  const updateItem = (type, patch) =>
    setForm((current) => ({
      ...current,
      requiredItems: normalizeItems(
        current.requiredItems.map((item) =>
          item.type === type ? { ...item, ...patch } : item,
        ),
      ),
    }));
  const toggleUse = (type) =>
    setForm((current) => {
      const exists = current.requiredItems.some((item) => item.type === type);
      return {
        ...current,
        requiredItems: exists
          ? normalizeItems(
              current.requiredItems.filter((item) => item.type !== type),
            )
          : normalizeItems([
              ...current.requiredItems,
              { type, isRequired: true },
            ]),
      };
    });
  const move = (type, direction) =>
    setForm((current) => {
      const next = [...current.requiredItems],
        index = next.findIndex((item) => item.type === type),
        target = index + direction;
      if (index < 0 || target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, requiredItems: normalizeItems(next) };
    });
  const save = async (event, openAfter = false) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      let saved;
      if (editing) {
        saved = (await updateRequirement(editing.id, form)).data;
      } else {
        saved = (await createRequirement(form)).data;
      }
      if (openAfter && saved?.id)
        await changeRequirementStatus(saved.id, "OPEN");
      close();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  const action = async (fn) => {
    try {
      setError("");
      await fn();
      await load();
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <div className="workflow-page">
      <div className="page-title row-between">
        <div>
          <h2>Yêu cầu và đợt nộp</h2>
          <p>Quản lý yêu cầu nộp cho lớp học phần bạn phụ trách.</p>
        </div>
        {!show && (
          <button className="btn-primary compact-button" onClick={() => open()}>
            Tạo yêu cầu
          </button>
        )}
      </div>
      {error && (
        <div className="alert error">
          <span>{error}</span>
          <button type="button" aria-label="Đóng" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}
      {show && (
        <form
          className="panel requirement-builder"
          onSubmit={(event) => save(event, false)}
        >
          <div className="section-heading">
            <div>
              <h3>{editing ? "Chỉnh sửa yêu cầu" : "Tạo yêu cầu tiến độ"}</h3>
              <p>
                Thiết lập thời gian, nội dung và cách sinh viên gửi tiến độ.
              </p>
            </div>
          </div>
          <div className="builder-grid two">
            <CourseClassSelect
              role="LECTURER"
              value={String(form.classId || "")}
              onChange={(classId) => setForm({ ...form, classId })}
            />
            <label>
              Loại yêu cầu
              <select
                value={form.requirementType}
                onChange={(e) =>
                  setForm({ ...form, requirementType: e.target.value })
                }
              >
                <option value="WEEKLY_PROGRESS">Tiến độ tuần</option>
                <option value="ASSIGNMENT">Bài nộp</option>
              </select>
            </label>
          </div>
          <div className="builder-grid two">
            {form.requirementType === "WEEKLY_PROGRESS" && (
              <label>
                Tuần
                <input
                  type="number"
                  min="1"
                  max="53"
                  required
                  value={form.weekNumber}
                  onChange={(e) =>
                    setForm({ ...form, weekNumber: e.target.value })
                  }
                />
              </label>
            )}
            <label>
              Tên yêu cầu
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ví dụ: Tuần 1 — Phân tích yêu cầu"
              />
            </label>
          </div>
          <label>
            Mô tả
            <textarea
              required
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </label>
          <label>
            Hướng dẫn cho sinh viên
            <textarea
              value={form.instructions || ""}
              onChange={(e) =>
                setForm({ ...form, instructions: e.target.value })
              }
            />
          </label>
          <div className="builder-grid four">
            <label>
              Thời gian mở<small>Ngày và giờ bắt đầu nhận bài</small>
              <input
                type="datetime-local"
                required
                value={form.startAt}
                onChange={(e) => setForm({ ...form, startAt: e.target.value })}
              />
            </label>
            <label>
              Hạn nộp<small>Ngày và giờ kết thúc nhận bài</small>
              <input
                type="datetime-local"
                required
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </label>
            <label>
              Số lần được nộp
              <input
                type="number"
                min="1"
                required
                value={form.maxAttempts}
                onChange={(e) =>
                  setForm({ ...form, maxAttempts: e.target.value })
                }
              />
            </label>
            <label>
              Dung lượng tối đa mỗi tệp (MB)
              <input
                type="number"
                min="1"
                value={form.maxFileSizeMb || ""}
                onChange={(e) =>
                  setForm({ ...form, maxFileSizeMb: e.target.value })
                }
              />
            </label>
          </div>
          <div className="toggle-row">
            <label>
              <input
                type="checkbox"
                checked={form.allowLate}
                onChange={(e) =>
                  setForm({ ...form, allowLate: e.target.checked })
                }
              />{" "}
              Cho phép nộp sau hạn
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.allowResubmission}
                onChange={(e) =>
                  setForm({ ...form, allowResubmission: e.target.checked })
                }
              />{" "}
              Cho phép nộp lại
            </label>
          </div>
          <div className="section-heading">
            <div>
              <h3>Hạng mục sinh viên cần nộp</h3>
              <p>
                Chọn các nội dung sẽ xuất hiện trong biểu mẫu nộp tiến độ của
                sinh viên.
              </p>
            </div>
          </div>
          {SUBMISSION_ITEM_GROUPS.map((group) => (
            <section className="item-group" key={group.key}>
              <h4>{group.title}</h4>
              <div className="submission-item-grid">
                {SUBMISSION_ITEM_TYPES.filter(
                  (type) => getSubmissionItemGroup(type) === group.key,
                ).map((type) => {
                  const selected = form.requiredItems.find(
                      (item) => item.type === type,
                    ),
                    Icon = icons[group.key];
                  return (
                    <article
                      className={`submission-item-card ${selected ? "selected" : ""}`}
                      key={type}
                    >
                      <Icon size={22} />
                      <div className="item-copy">
                        <strong>{getSubmissionItemLabel(type)}</strong>
                        <p>{getSubmissionItemDescription(type)}</p>
                      </div>
                      <div className="item-controls">
                        <label>
                          <input
                            type="checkbox"
                            checked={Boolean(selected)}
                            onChange={() => toggleUse(type)}
                          />{" "}
                          Sử dụng
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            disabled={!selected}
                            checked={Boolean(selected?.isRequired)}
                            onChange={(e) =>
                              updateItem(type, { isRequired: e.target.checked })
                            }
                          />{" "}
                          Bắt buộc
                        </label>
                      </div>
                      {selected && (
                        <div className="order-controls">
                          <button
                            type="button"
                            aria-label="Di chuyển lên"
                            onClick={() => move(type, -1)}
                          >
                            <ChevronUp size={16} />
                          </button>
                          <button
                            type="button"
                            aria-label="Di chuyển xuống"
                            onClick={() => move(type, 1)}
                          >
                            <ChevronDown size={16} />
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
          <div className="form-actions builder-actions">
            <button type="button" className="btn-light" onClick={close}>
              Hủy
            </button>
            <button className="btn-light" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu bản nháp"}
            </button>
            {!editing && (
              <button
                type="button"
                className="btn-primary"
                disabled={saving || !form.requiredItems.length}
                onClick={(event) => save(event, true)}
              >
                Lưu và mở yêu cầu
              </button>
            )}
          </div>
        </form>
      )}
      {!show && (
        <div className="panel table-wrap">
          {loading ? (
            <p>Đang tải...</p>
          ) : items.length ? (
            <table>
              <thead>
                <tr>
                  <th>Yêu cầu</th>
                  <th>Lớp</th>
                  <th>Thời hạn</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.title}</strong>
                      <div className="item-badges">
                        {item.requiredItems.slice(0, 3).map((x) => (
                          <span key={x.id || x.type}>
                            {getSubmissionItemLabel(x.type)}
                          </span>
                        ))}
                        {item.requiredItems.length > 3 && (
                          <span>
                            +{item.requiredItems.length - 3} hạng mục khác
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{item.classCode}</td>
                    <td className="nowrap">
                      {formatDateRange(item.startAt, item.deadline)}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${getStatusBadgeVariant(item.effectiveStatus || item.status)}`}
                      >
                        {getStatusLabel(item.effectiveStatus || item.status)}
                      </span>
                    </td>
                    <td>
                      <div className="compact-actions">
                        <button onClick={() => open(item)}>Chỉnh sửa</button>
                        {["DRAFT", "CANCELLED"].includes(item.status) && (
                          <button
                            onClick={() =>
                              action(() =>
                                changeRequirementStatus(item.id, "OPEN"),
                              )
                            }
                          >
                            Mở yêu cầu
                          </button>
                        )}
                        {item.status === "OPEN" && (
                          <button
                            onClick={() =>
                              action(() =>
                                changeRequirementStatus(item.id, "CLOSED"),
                              )
                            }
                          >
                            Đóng yêu cầu
                          </button>
                        )}
                        {item.status !== "CLOSED" && (
                          <button
                            onClick={() =>
                              action(() =>
                                changeRequirementStatus(item.id, "CANCELLED"),
                              )
                            }
                          >
                            Hủy yêu cầu
                          </button>
                        )}
                        {["DRAFT", "CANCELLED"].includes(item.status) && (
                          <button
                            onClick={() =>
                              action(() => deleteRequirement(item.id))
                            }
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <FileText size={38} />
              <h3>Chưa có yêu cầu nộp nào.</h3>
              <p>Tạo yêu cầu đầu tiên để bắt đầu theo dõi tiến độ sinh viên.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
