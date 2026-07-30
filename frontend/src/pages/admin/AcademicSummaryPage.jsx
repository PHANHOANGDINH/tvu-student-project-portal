import { useEffect, useMemo, useState } from "react";
import {
    BookOpen,
    Plus,
    Search,
    UserRoundCheck,
    Users,
    Pencil,
    Lock,
    Unlock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getUsers } from "../../api/adminApi";
import {
    createAcademic,
    listAcademic,
    setAcademicStatus,
    updateAcademic,
} from "../../api/academicsApi";

const configs = {
    "academic-years": {
        fields: [
            ["name", "Tên năm học", "text"],
            ["startDate", "Ngày bắt đầu", "date"],
            ["endDate", "Ngày kết thúc", "date"],
        ],
        columns: [
            ["name", "Tên năm học"],
            ["startDate", "Bắt đầu"],
            ["endDate", "Kết thúc"],
        ],
    },

    semesters: {
        fields: [
            ["academicYearId", "Năm học", "academic-years"],
            ["name", "Tên học kỳ", "text"],
            ["code", "Mã học kỳ", "text"],
            ["startDate", "Ngày bắt đầu", "date"],
            ["endDate", "Ngày kết thúc", "date"],
        ],

        columns: [
            ["code", "Mã"],
            ["name", "Tên học kỳ"],
            ["academicYearId", "Năm học"],
            ["startDate", "Bắt đầu"],
            ["endDate", "Kết thúc"],
        ],
    },

    subjects: {
        fields: [
            ["code", "Mã môn học", "text"],
            ["name", "Tên môn học", "text"],
            ["credits", "Số tín chỉ", "number"],
            ["description", "Mô tả", "text"],
        ],

        columns: [
            ["code", "Mã môn"],
            ["name", "Tên môn học"],
            ["credits", "Tín chỉ"],
        ],
    },

    "course-classes": {
        fields: [
            ["code", "Mã lớp học phần", "text"],
            ["subjectId", "Môn học", "subjects"],
            ["semesterId", "Học kỳ", "semesters"],
            ["lecturerId", "Giảng viên phụ trách", "lecturers"],
            ["maxStudents", "Sĩ số tối đa", "number"],
            ["status", "Trạng thái", "status"],
        ],

        columns: [
            ["code", "Mã lớp"],
            ["subjectId", "Môn học"],
            ["semesterId", "Học kỳ"],
            ["lecturerName", "Giảng viên"],
            ["status", "Trạng thái"],
        ],
    },
};

const STATUS_TEXT = {
    ACTIVE: "Hoạt động",
    INACTIVE: "Đã khóa",
    COMPLETED: "Đã kết thúc",
    CANCELLED: "Đã hủy",
};

const INITIAL_FORM = {
    status: "ACTIVE",
};

const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString("vi-VN") : "—";

export default function AcademicSummaryPage({ resource, title }) {
    const navigate = useNavigate();

    const key =
        resource === "academicYears"
            ? "academic-years"
            : resource === "courseClasses"
              ? "course-classes"
              : resource;

    const config = configs[key];

    const [items, setItems] = useState([]);
    const [refs, setRefs] = useState({});

    const [form, setForm] = useState(INITIAL_FORM);

    const [editing, setEditing] = useState(null);

    const [open, setOpen] = useState(false);

    const [search, setSearch] = useState("");

    const [page, setPage] = useState(1);

    const [pages, setPages] = useState(1);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [message, setMessage] = useState(null);

    const statistics = useMemo(
        () => ({
            total: items.length,
            active: items.filter((x) => x.isActive).length,
            inactive: items.filter((x) => !x.isActive).length,
        }),
        [items],
    );

    const load = async () => {
        try {
            setLoading(true);

            const response = await listAcademic(key, {
                page,
                pageSize: 10,
                search,
            });

            setItems(response.data.items || []);

            setPages(response.data.totalPages || 1);
        } catch (error) {
            setMessage({
                type: "error",
                text: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [key, page]);

    useEffect(() => {
        const types = [
            ...new Set(
                config.fields.map((x) => x[2]).filter((x) => configs[x]),
            ),
        ];

        const jobs = types.map((type) =>
            listAcademic(type, { pageSize: 100 }).then((r) => [
                type,
                r.data.items || [],
            ]),
        );

        if (config.fields.some((x) => x[2] === "lecturers")) {
            jobs.push(
                getUsers({
                    role: "LECTURER",
                    status: "ACTIVE",
                    pageSize: 100,
                    sortBy: "fullName",
                    sortOrder: "asc",
                }).then((r) => ["lecturers", r.data.items || []]),
            );
        }

        Promise.all(jobs)
            .then((result) => setRefs(Object.fromEntries(result)))
            .catch((error) =>
                setMessage({
                    type: "error",
                    text: error.message,
                }),
            );
    }, [key]);
    return (
        <div className="space-y-6">
            {/* Header */}

            <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-xl">
                <div className="flex flex-col gap-8 p-8 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <span className="inline-flex rounded-full bg-white/10 px-4 py-1 text-xs font-semibold tracking-widest text-slate-200">
                            QUẢN LÝ HỌC VỤ
                        </span>

                        <h1 className="mt-4 text-4xl font-bold text-white">
                            {title}
                        </h1>

                        <p className="mt-3 max-w-2xl text-slate-300">
                            Quản lý thông tin {title.toLowerCase()} trong hệ
                            thống.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {key === "course-classes" && (
                            <>
                                <button
                                    className="rounded-2xl bg-white px-5 py-3 font-medium text-slate-700 shadow transition hover:bg-slate-100"
                                    onClick={() =>
                                        navigate("/admin/students/import")
                                    }
                                >
                                    <Users size={18} className="mr-2 inline" />
                                    Danh sách sinh viên
                                </button>

                                <button
                                    className="rounded-2xl bg-white px-5 py-3 font-medium text-slate-700 shadow transition hover:bg-slate-100"
                                    onClick={() =>
                                        navigate("/admin/course-classes")
                                    }
                                >
                                    <UserRoundCheck
                                        size={18}
                                        className="mr-2 inline"
                                    />
                                    Phân công GV
                                </button>
                            </>
                        )}

                        <button
                            className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-700"
                            onClick={() => {
                                setEditing(null);
                                setForm(INITIAL_FORM);
                                setOpen(true);
                            }}
                        >
                            <Plus size={18} className="mr-2 inline" />
                            Thêm mới
                        </button>
                    </div>
                </div>
            </div>

            {/* Statistics */}

            <div className="grid gap-5 md:grid-cols-3">
                <div className="rounded-3xl border bg-white p-6 shadow-sm">
                    <p className="text-sm text-slate-500">Tổng dữ liệu</p>

                    <h2 className="mt-3 text-4xl font-bold">
                        {statistics.total}
                    </h2>
                </div>

                <div className="rounded-3xl border bg-white p-6 shadow-sm">
                    <p className="text-sm text-slate-500">Đang hoạt động</p>

                    <h2 className="mt-3 text-4xl font-bold text-emerald-600">
                        {statistics.active}
                    </h2>
                </div>

                <div className="rounded-3xl border bg-white p-6 shadow-sm">
                    <p className="text-sm text-slate-500">Đã khóa</p>

                    <h2 className="mt-3 text-4xl font-bold text-red-500">
                        {statistics.inactive}
                    </h2>
                </div>
            </div>

            {message && (
                <div
                    className={`rounded-2xl border p-4 font-medium

            ${
                message.type === "success"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
            }`}
                >
                    {message.text}
                </div>
            )}

            {/* Search */}

            <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
                <form
                    className="flex flex-wrap items-center justify-between gap-4 p-6"
                    onSubmit={(e) => {
                        e.preventDefault();

                        page === 1 ? load() : setPage(1);
                    }}
                >
                    <div className="relative w-full max-w-lg">
                        <Search
                            size={18}
                            className="absolute left-4 top-4 text-slate-400"
                        />

                        <input
                            className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none transition focus:border-blue-500"
                            placeholder={`Tìm kiếm ${title.toLowerCase()}...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <button className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700">
                        Tìm kiếm
                    </button>
                </form>
                {/* Table */}

                <div className="border-t">
                    {loading ? (
                        <div className="space-y-4 p-6">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                    key={i}
                                    className="h-16 animate-pulse rounded-2xl bg-slate-100"
                                />
                            ))}
                        </div>
                    ) : !items.length ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="mb-6 rounded-full bg-slate-100 p-6">
                                <BookOpen
                                    size={42}
                                    className="text-slate-500"
                                />
                            </div>

                            <h3 className="text-xl font-semibold">
                                Chưa có dữ liệu
                            </h3>

                            <p className="mt-2 text-slate-500">
                                Nhấn "Thêm mới" để bắt đầu.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="sticky top-0 bg-slate-100">
                                    <tr>
                                        {config.columns.map(
                                            ([field, label]) => (
                                                <th
                                                    key={field}
                                                    className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                                                >
                                                    {label}
                                                </th>
                                            ),
                                        )}

                                        <th className="px-6 py-4">
                                            Trạng thái
                                        </th>

                                        <th className="px-6 py-4 text-center">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {items.map((item, index) => (
                                        <tr
                                            key={item.id}
                                            className={`transition hover:bg-blue-50

                            ${index % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                                        >
                                            {config.columns.map(([field]) => (
                                                <td
                                                    key={field}
                                                    className="px-6 py-5"
                                                >
                                                    {display(item, field)}
                                                </td>
                                            ))}

                                            <td className="px-6 py-5">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold

                                    ${
                                        item.isActive
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                    }`}
                                                >
                                                    {item.isActive
                                                        ? "Hoạt động"
                                                        : "Đã khóa"}
                                                </span>
                                            </td>

                                            <td className="px-6 py-5">
                                                <div className="flex justify-center gap-3">
                                                    <button
                                                        onClick={() =>
                                                            edit(item)
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-blue-600 transition hover:bg-blue-100"
                                                    >
                                                        <Pencil size={16} />
                                                        Sửa
                                                    </button>

                                                    <button
                                                        onClick={async () => {
                                                            if (
                                                                window.confirm(
                                                                    `${item.isActive ? "Khóa" : "Mở khóa"} dữ liệu này?`,
                                                                )
                                                            ) {
                                                                await setAcademicStatus(
                                                                    key,
                                                                    item.id,
                                                                    !item.isActive,
                                                                );

                                                                load();
                                                            }
                                                        }}
                                                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 transition

                                        ${
                                            item.isActive
                                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                                : "bg-green-50 text-green-600 hover:bg-green-100"
                                        }`}
                                                    >
                                                        {item.isActive ? (
                                                            <Lock size={16} />
                                                        ) : (
                                                            <Unlock size={16} />
                                                        )}

                                                        {item.isActive
                                                            ? "Khóa"
                                                            : "Mở khóa"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}

                <div className="flex items-center justify-between border-t bg-slate-50 px-6 py-5">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="rounded-xl border border-slate-300 bg-white px-5 py-2 transition hover:bg-slate-100 disabled:opacity-40"
                    >
                        ← Trước
                    </button>

                    <div className="text-sm font-medium">
                        Trang
                        <span className="mx-2 rounded-lg bg-blue-100 px-3 py-1 text-blue-700">
                            {page}
                        </span>
                        /<span className="ml-2">{pages}</span>
                    </div>

                    <button
                        disabled={page === pages}
                        onClick={() => setPage(page + 1)}
                        className="rounded-xl border border-slate-300 bg-white px-5 py-2 transition hover:bg-slate-100 disabled:opacity-40"
                    >
                        Sau →
                    </button>
                </div>
            </div>
            {/* ================= Modal ================= */}

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                        {/* Header */}

                        <div className="flex items-center justify-between border-b bg-slate-50 px-8 py-6">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                                    {editing ? "CẬP NHẬT DỮ LIỆU" : "THÊM MỚI"}
                                </p>

                                <h2 className="mt-2 text-2xl font-bold text-slate-800">
                                    {title}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-200"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={submit}>
                            <div className="grid gap-6 p-8 md:grid-cols-2">
                                {config.fields.map(([field, label, type]) => (
                                    <div key={field} className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">
                                            {label}
                                        </label>

                                        {configs[type] ? (
                                            <select
                                                required
                                                value={form[field] || ""}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        [field]: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            >
                                                <option value="">
                                                    -- Chọn --
                                                </option>

                                                {(refs[type] || []).map((x) => (
                                                    <option
                                                        key={x.id}
                                                        value={x.id}
                                                    >
                                                        {x.code
                                                            ? `${x.code} - `
                                                            : ""}

                                                        {x.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : type === "lecturers" ? (
                                            <select
                                                value={form[field] || ""}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        [field]: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            >
                                                <option value="">
                                                    Chưa phân công
                                                </option>

                                                {(refs.lecturers || []).map(
                                                    (x) => (
                                                        <option
                                                            key={x.id}
                                                            value={x.id}
                                                        >
                                                            {x.userCode} -{" "}
                                                            {x.fullName}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        ) : type === "status" ? (
                                            <select
                                                value={form[field] || "ACTIVE"}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        [field]: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            >
                                                {Object.entries(
                                                    STATUS_TEXT,
                                                ).map(([value, label]) => (
                                                    <option
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {label}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type={type}
                                                required={
                                                    ![
                                                        "description",
                                                        "maxStudents",
                                                    ].includes(field)
                                                }
                                                value={form[field] || ""}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        [field]: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}

                            <div className="flex justify-end gap-4 border-t bg-slate-50 px-8 py-6">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="rounded-xl border border-slate-300 bg-white px-6 py-3 transition hover:bg-slate-100"
                                >
                                    Hủy
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                                >
                                    {saving
                                        ? "Đang lưu..."
                                        : editing
                                          ? "Cập nhật"
                                          : "Thêm mới"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
