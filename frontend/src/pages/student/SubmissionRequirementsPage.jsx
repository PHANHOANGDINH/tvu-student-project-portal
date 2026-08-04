import { useEffect, useState } from "react";
import { listStudentRequirements } from "../../api/submissionRequirementsApi";

export default function SubmissionRequirementsPage() {
    const [items, setItems] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        listStudentRequirements()
            .then((r) => setItems(r.data || []))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "open":
            case "active":
                return "#16a34a";
            case "closed":
                return "#dc2626";
            case "upcoming":
                return "#2563eb";
            default:
                return "#d97706";
        }
    };

    return (
        <div>
            <div className="page-title">
                <h2>📤 Yêu cầu nộp bài</h2>
                <p>
                    Xem lịch, hạn nộp và tài liệu bắt buộc của các lớp đang tham
                    gia.
                </p>
            </div>

            {error && <div className="alert error">{error}</div>}

            <div className="panel">
                {loading ? (
                    <p>Đang tải dữ liệu...</p>
                ) : (
                    <table style={{ width: "100%" }}>
                        <thead>
                            <tr>
                                <th align="left">Yêu cầu</th>
                                <th align="left">Lớp</th>
                                <th align="left">Hạn nộp</th>
                                <th align="center">Trạng thái</th>
                            </tr>
                        </thead>

                        <tbody>
                            {items.length > 0 ? (
                                items.map((x) => (
                                    <tr
                                        key={x.id}
                                        onClick={() => setSelected(x)}
                                        style={{
                                            cursor: "pointer",
                                        }}
                                    >
                                        <td>
                                            <strong>{x.title}</strong>
                                        </td>

                                        <td>{x.classCode}</td>

                                        <td>
                                            {new Date(
                                                x.deadline,
                                            ).toLocaleString("vi-VN")}
                                        </td>

                                        <td align="center">
                                            <span
                                                style={{
                                                    color: getStatusColor(
                                                        x.effectiveStatus,
                                                    ),
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                {x.effectiveStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="4"
                                        style={{ textAlign: "center" }}
                                    >
                                        Chưa có yêu cầu nộp bài.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {selected && (
                <div
                    className="panel"
                    style={{
                        marginTop: 20,
                        borderLeft: "5px solid #2563eb",
                    }}
                >
                    <div className="row-between">
                        <div>
                            <h3 style={{ marginBottom: 5 }}>
                                📄 {selected.title}
                            </h3>

                            <p style={{ color: "#666" }}>
                                Lớp: <strong>{selected.classCode}</strong>
                            </p>
                        </div>

                        <button
                            className="btn-light"
                            onClick={() => setSelected(null)}
                        >
                            ✕ Đóng
                        </button>
                    </div>

                    <hr />

                    <p>
                        <strong>Mô tả:</strong>
                    </p>

                    <p>{selected.description || "Không có mô tả."}</p>

                    {selected.instructions && (
                        <>
                            <p>
                                <strong>Hướng dẫn nộp</strong>
                            </p>

                            <p>{selected.instructions}</p>
                        </>
                    )}

                    <hr />

                    <p>
                        🕒 <strong>Bắt đầu:</strong>{" "}
                        {new Date(selected.startAt).toLocaleString("vi-VN")}
                    </p>

                    <p>
                        ⏰ <strong>Hạn nộp:</strong>{" "}
                        {new Date(selected.deadline).toLocaleString("vi-VN")}
                    </p>

                    <p>
                        🔄 <strong>Số lần nộp tối đa:</strong>{" "}
                        {selected.maxAttempts}
                    </p>

                    <p>
                        📌 <strong>Cho phép nộp trễ:</strong>{" "}
                        {selected.allowLate ? "Có" : "Không"}
                    </p>

                    <p>
                        ♻️ <strong>Cho phép nộp lại:</strong>{" "}
                        {selected.allowResubmission ? "Có" : "Không"}
                    </p>

                    <hr />

                    <p>
                        <strong>📎 Tài liệu bắt buộc</strong>
                    </p>

                    {selected.requiredItems?.length ? (
                        <ul>
                            {selected.requiredItems.map((item, index) => (
                                <li key={index}>{item.type}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>Không có tài liệu yêu cầu.</p>
                    )}
                </div>
            )}
        </div>
    );
}
