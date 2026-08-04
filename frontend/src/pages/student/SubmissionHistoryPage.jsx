import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { studentSubmission } from "../../api/submissionsApi";

export default function SubmissionHistoryPage() {
    const { id } = useParams();

    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        studentSubmission(id)
            .then((r) => setData(r.data))
            .catch((e) => setError(e.message));
    }, [id]);

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "approved":
                return "#16a34a";
            case "rejected":
                return "#dc2626";
            case "pending":
                return "#d97706";
            default:
                return "#2563eb";
        }
    };

    return (
        <div>
            <div className="page-title">
                <h2>📂 Lịch sử các lần nộp</h2>
                <p>{data?.requirementTitle}</p>
            </div>

            {error && <div className="alert error">{error}</div>}

            {!data ? (
                <div className="panel">
                    <p>Đang tải dữ liệu...</p>
                </div>
            ) : data.attempts.length === 0 ? (
                <div className="panel">
                    <h3>Chưa có lần nộp nào</h3>
                </div>
            ) : (
                data.attempts.map((a) => (
                    <div
                        className="panel"
                        key={a.id}
                        style={{
                            marginBottom: 20,
                            borderLeft: "5px solid #2563eb",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 15,
                            }}
                        >
                            <div>
                                <h3 style={{ margin: 0 }}>
                                    📑 Lần nộp #{a.attemptNumber}
                                </h3>

                                <p
                                    style={{
                                        margin: "6px 0 0",
                                        color: "#666",
                                    }}
                                >
                                    🕒{" "}
                                    {new Date(a.submittedAt).toLocaleString(
                                        "vi-VN",
                                    )}
                                </p>
                            </div>

                            <div style={{ textAlign: "right" }}>
                                <span
                                    style={{
                                        padding: "6px 12px",
                                        borderRadius: 20,
                                        background: "#f3f4f6",
                                        color: getStatusColor(a.status),
                                        fontWeight: 600,
                                    }}
                                >
                                    {a.status}
                                </span>

                                {a.isLate && (
                                    <div
                                        style={{
                                            color: "#dc2626",
                                            marginTop: 8,
                                            fontWeight: 600,
                                        }}
                                    >
                                        ⚠️ Nộp trễ
                                    </div>
                                )}
                            </div>
                        </div>

                        <hr />

                        <div style={{ marginTop: 15 }}>
                            <h4>📄 Tệp đính kèm</h4>

                            {a.files.length === 0 ? (
                                <p>Không có tệp đính kèm.</p>
                            ) : (
                                <table
                                    style={{
                                        width: "100%",
                                        borderCollapse: "collapse",
                                    }}
                                >
                                    <thead>
                                        <tr>
                                            <th align="left">Tên file</th>
                                            <th align="left">Loại</th>
                                            <th align="right">Kích thước</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {a.files.map((f) => (
                                            <tr key={f.id}>
                                                <td>{f.originalName}</td>
                                                <td>{f.type}</td>
                                                <td align="right">
                                                    {(
                                                        Number(f.size) /
                                                        1024 /
                                                        1024
                                                    ).toFixed(2)}{" "}
                                                    MB
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div style={{ marginTop: 25 }}>
                            <h4>🔗 Liên kết</h4>

                            {a.links.length === 0 ? (
                                <p>Không có liên kết.</p>
                            ) : (
                                <ul style={{ paddingLeft: 20 }}>
                                    {a.links.map((l) => (
                                        <li
                                            key={l.id}
                                            style={{ margin: "8px 0" }}
                                        >
                                            <strong>{l.type}: </strong>

                                            <a
                                                href={l.url}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                {l.url}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
