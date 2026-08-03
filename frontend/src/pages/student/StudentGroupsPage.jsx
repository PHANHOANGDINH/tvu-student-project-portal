import { useEffect, useState } from "react";
import {
    addGroupMember,
    createGroup,
    getMyGroup,
    removeGroupMember,
    transferGroupLeader,
} from "../../api/groupsApi";
import { getUser } from "../../utils/auth";

export default function StudentGroupsPage() {
    const [group, setGroup] = useState(null);
    const [classId, setClassId] = useState("");
    const [name, setName] = useState("");
    const [studentId, setStudentId] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const user = getUser();

    const load = async () => {
        setLoading(true);
        setError("");

        try {
            setGroup((await getMyGroup(classId)).data);
        } catch (e) {
            if (e.status === 404) setGroup(null);
            else setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const act = async (fn) => {
        try {
            setError("");
            await fn();
            await load();
        } catch (e) {
            setError(e.message);
        }
    };

    return (
        <div>
            <div
                className="page-title row-between"
                style={{
                    marginBottom: 25,
                    alignItems: "center",
                }}
            >
                <div>
                    <h2 style={{ marginBottom: 8 }}>
                        👥 Nhóm sinh viên của tôi
                    </h2>

                    <p style={{ color: "#6b7280" }}>
                        Tạo nhóm và quản lý thành viên trong lớp học phần.
                    </p>
                </div>

                {group && (
                    <div
                        style={{
                            background: "#eff6ff",
                            color: "#2563eb",
                            padding: "10px 18px",
                            borderRadius: 999,
                            fontWeight: 700,
                            fontSize: 15,
                        }}
                    >
                        {group.memberCount}/{group.maxMembers} thành viên
                    </div>
                )}
            </div>

            {error && (
                <div
                    className="alert error"
                    style={{
                        marginBottom: 20,
                    }}
                >
                    {error}
                </div>
            )}

            <div
                className="panel"
                style={{
                    borderRadius: 18,
                    padding: 24,
                }}
            >
                <div
                    className="form-row"
                    style={{
                        marginBottom: 24,
                    }}
                >
                    <input
                        placeholder="Nhập ID lớp học phần..."
                        value={classId}
                        onChange={(e) => setClassId(e.target.value)}
                    />

                    <button className="btn-light" onClick={load}>
                        🔄 Tải nhóm
                    </button>
                </div>
                {loading ? (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "40px 0",
                            color: "#6b7280",
                            fontSize: 16,
                        }}
                    >
                        ⏳ Đang tải dữ liệu...
                    </div>
                ) : !group ? (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            act(() =>
                                createGroup(classId, {
                                    name,
                                }),
                            );
                        }}
                    >
                        <div
                            style={{
                                background: "#f8fafc",
                                border: "1px solid #e5e7eb",
                                borderRadius: 16,
                                padding: 24,
                            }}
                        >
                            <h3
                                style={{
                                    marginBottom: 20,
                                }}
                            >
                                ➕ Tạo nhóm mới
                            </h3>

                            <div className="form-row">
                                <input
                                    required
                                    placeholder="Nhập tên nhóm..."
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />

                                <button className="btn-primary">
                                    Tạo nhóm
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <>
                        <div
                            style={{
                                background: "#f8fafc",
                                border: "1px solid #e5e7eb",
                                borderRadius: 16,
                                padding: 20,
                                marginBottom: 25,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: 10,
                                }}
                            >
                                <h3
                                    style={{
                                        margin: 0,
                                    }}
                                >
                                    {group.name}
                                </h3>

                                <span
                                    style={{
                                        background: "#2563eb",
                                        color: "#fff",
                                        padding: "6px 14px",
                                        borderRadius: 999,
                                        fontWeight: 600,
                                    }}
                                >
                                    {group.memberCount}/{group.maxMembers} thành
                                    viên
                                </span>
                            </div>

                            <p
                                style={{
                                    marginTop: 15,
                                    color: "#6b7280",
                                }}
                            >
                                <strong>Lớp:</strong> {group.classCode}
                                <br />
                                <strong>Trưởng nhóm:</strong> {group.leaderName}
                            </p>
                        </div>

                        <div
                            className="form-row"
                            style={{
                                marginBottom: 25,
                            }}
                        >
                            <input
                                placeholder="Nhập ID sinh viên..."
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                            />

                            <button
                                className="btn-primary"
                                onClick={() =>
                                    act(() =>
                                        addGroupMember(
                                            group.id,
                                            Number(studentId),
                                        ),
                                    )
                                }
                            >
                                ➕ Thêm thành viên
                            </button>
                        </div>

                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                overflow: "hidden",
                                borderRadius: 12,
                            }}
                        >
                            <thead>
                                <tr
                                    style={{
                                        background: "#f3f4f6",
                                    }}
                                >
                                    <th
                                        style={{
                                            padding: 14,
                                            textAlign: "left",
                                        }}
                                    >
                                        Thành viên
                                    </th>

                                    <th
                                        style={{
                                            padding: 14,
                                            textAlign: "left",
                                        }}
                                    >
                                        MSSV
                                    </th>

                                    <th
                                        style={{
                                            padding: 14,
                                            textAlign: "center",
                                        }}
                                    >
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {group.members?.map((m) => (
                                    <tr
                                        key={m.studentId}
                                        style={{
                                            borderBottom: "1px solid #e5e7eb",
                                        }}
                                    >
                                        <td
                                            style={{
                                                padding: 16,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 10,
                                                    flexWrap: "wrap",
                                                }}
                                            >
                                                <strong>{m.fullName}</strong>

                                                {m.isLeader && (
                                                    <span
                                                        style={{
                                                            background:
                                                                "#FEF3C7",
                                                            color: "#92400E",
                                                            padding: "4px 10px",
                                                            borderRadius: 999,
                                                            fontSize: 12,
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        👑 Trưởng nhóm
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td
                                            style={{
                                                padding: 16,
                                                color: "#374151",
                                                fontWeight: 500,
                                            }}
                                        >
                                            {m.userCode}
                                        </td>

                                        <td
                                            style={{
                                                padding: 16,
                                                textAlign: "center",
                                            }}
                                        >
                                            {!m.isLeader &&
                                                group.leaderId ===
                                                    Number(
                                                        user?.id || user?.Id,
                                                    ) && (
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent:
                                                                "center",
                                                            gap: 10,
                                                            flexWrap: "wrap",
                                                        }}
                                                    >
                                                        <button
                                                            className="btn-light"
                                                            style={{
                                                                background:
                                                                    "#F59E0B",
                                                                color: "#fff",
                                                            }}
                                                            onClick={() =>
                                                                act(() =>
                                                                    transferGroupLeader(
                                                                        group.id,
                                                                        m.studentId,
                                                                    ),
                                                                )
                                                            }
                                                        >
                                                            👑 Chuyển trưởng
                                                            nhóm
                                                        </button>

                                                        <button
                                                            className="btn-light"
                                                            style={{
                                                                background:
                                                                    "#EF4444",
                                                                color: "#fff",
                                                            }}
                                                            onClick={() =>
                                                                act(() =>
                                                                    removeGroupMember(
                                                                        group.id,
                                                                        m.studentId,
                                                                    ),
                                                                )
                                                            }
                                                        >
                                                            🗑 Xóa
                                                        </button>
                                                    </div>
                                                )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </div>
        </div>
    );
}
