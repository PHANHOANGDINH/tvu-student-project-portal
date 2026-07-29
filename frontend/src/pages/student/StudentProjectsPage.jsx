import { useEffect, useState } from "react";
import { Search, FolderKanban, BookOpen, User, ArrowRight } from "lucide-react";

import {
    getStudentProjectsApi,
    getStudentRegistrationsApi,
    registerStudentProjectApi,
    cancelStudentRegistrationApi,
} from "../../api/studentApi";

import ConfirmModal from "../../components/common/ConfirmModal";

import {
    EmptyState,
    LoadingState,
    StatusBadge,
} from "../../components/common/UiState";

function StudentProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [regs, setRegs] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");

    const [confirm, setConfirm] = useState(null);
    const [note, setNote] = useState("");

    async function load() {
        try {
            setLoading(true);
            setError("");

            const [p, r] = await Promise.all([
                getStudentProjectsApi({
                    limit: 100,
                    search,
                }),
                getStudentRegistrationsApi({
                    limit: 100,
                }),
            ]);

            setProjects(p?.data || []);
            setRegs(r?.data || []);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function submit() {
        try {
            setSaving(true);
            setError("");

            if (confirm.type === "register") {
                await registerStudentProjectApi(confirm.item.Id, note);
            } else {
                await cancelStudentRegistrationApi(confirm.item.Id);
            }

            setSuccess(
                confirm.type === "register"
                    ? "Đăng ký đề tài thành công."
                    : "Đã hủy đăng ký.",
            );

            setConfirm(null);
            setNote("");

            await load();
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <LoadingState label="Đang tải danh sách đề tài..." />;
    }

    const hasRegister = regs.some((r) =>
        ["Pending", "Approved"].includes(r.Status),
    );

    return (
        <div className="space-y-8">
            {/* HERO */}
            <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-xl">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Đăng ký đề tài tốt nghiệp
                        </h1>

                        <p className="mt-3 text-blue-100 max-w-2xl">
                            Khám phá các đề tài đang mở, theo dõi trạng thái
                            đăng ký và gửi yêu cầu đến giảng viên hướng dẫn.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/20 backdrop-blur rounded-2xl p-5 min-w-[140px]">
                            <FolderKanban className="mb-2" />

                            <p className="text-sm text-blue-100">Đề tài</p>

                            <h2 className="text-3xl font-bold">
                                {projects.length}
                            </h2>
                        </div>

                        <div className="bg-white/20 backdrop-blur rounded-2xl p-5 min-w-[140px]">
                            <BookOpen className="mb-2" />

                            <p className="text-sm text-blue-100">Đăng ký</p>

                            <h2 className="text-3xl font-bold">
                                {regs.length}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* ALERT */}
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
                    {success}
                </div>
            )}

            {/* SEARCH */}
            <div className="bg-white rounded-3xl shadow p-6">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        load();
                    }}
                    className="flex flex-col md:flex-row gap-4"
                >
                    <div className="flex-1 relative">
                        <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                            className="w-full h-12 rounded-xl border border-gray-200 pl-11 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo tên hoặc mô tả đề tài..."
                        />
                    </div>

                    <button className="h-12 px-6 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition">
                        Tìm kiếm
                    </button>
                </form>
            </div>

            {/* ĐĂNG KÝ CỦA TÔI */}
            <div className="bg-white rounded-3xl shadow p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Đăng ký của tôi</h2>

                    <span className="text-sm text-gray-500">
                        {regs.length} đăng ký
                    </span>
                </div>

                {regs.length ? (
                    <div className="space-y-5">
                        {regs.map((r) => (
                            <div
                                key={r.Id}
                                className="border rounded-2xl p-5 hover:shadow-lg transition"
                            >
                                <div className="flex flex-col lg:flex-row lg:justify-between gap-5">
                                    <div className="flex gap-4">
                                        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                                            <User className="text-blue-600" />
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-lg">
                                                {r.Title}
                                            </h3>

                                            <p className="text-gray-500 mt-1">
                                                Giảng viên:{" "}
                                                {r.TeacherName || "-"}
                                            </p>

                                            {r.ReviewNote && (
                                                <div className="mt-3 bg-blue-50 rounded-xl p-3 text-sm">
                                                    <strong>Phản hồi:</strong>

                                                    <div className="mt-1">
                                                        {r.ReviewNote}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-3">
                                        <StatusBadge status={r.Status} />

                                        {r.Status === "Pending" && (
                                            <button
                                                onClick={() =>
                                                    setConfirm({
                                                        type: "cancel",
                                                        item: r,
                                                    })
                                                }
                                                className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition"
                                            >
                                                Hủy đăng ký
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="Bạn chưa đăng ký đề tài"
                        description="Hãy chọn một đề tài phù hợp ở danh sách bên dưới."
                    />
                )}
            </div>

            {/* DANH SÁCH ĐỀ TÀI */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Danh sách đề tài</h2>

                    <span className="text-sm text-gray-500">
                        {projects.length} đề tài
                    </span>
                </div>

                {projects.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {projects.map((p) => {
                            const approved = p.ApprovedStudents || 0;
                            const max = p.MaxStudents || 1;
                            const percent = Math.min(
                                (approved / max) * 100,
                                100,
                            );

                            return (
                                <div
                                    key={p.Id}
                                    className="bg-white rounded-3xl shadow hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                                >
                                    {/* Header */}
                                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 text-white">
                                        <div className="flex justify-between items-center">
                                            <StatusBadge status={p.Status} />

                                            <span className="text-sm">
                                                {approved}/{max} sinh viên
                                            </span>
                                        </div>

                                        <h3 className="mt-5 text-xl font-bold line-clamp-2">
                                            {p.Title}
                                        </h3>
                                    </div>

                                    {/* Body */}
                                    <div className="p-6">
                                        <p className="text-gray-600 text-sm leading-6 line-clamp-4">
                                            {p.Description || "Chưa có mô tả."}
                                        </p>

                                        <div className="mt-6 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">
                                                    👨‍🏫
                                                </span>

                                                <div>
                                                    <p className="text-xs text-gray-500">
                                                        Giảng viên
                                                    </p>

                                                    <p className="font-semibold">
                                                        {p.TeacherName ||
                                                            p.AdvisorTeacherName ||
                                                            "-"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-2">
                                                <span className="text-lg">
                                                    📋
                                                </span>

                                                <div>
                                                    <p className="text-xs text-gray-500">
                                                        Yêu cầu
                                                    </p>

                                                    <p className="text-sm">
                                                        {p.Requirements ||
                                                            "Không có"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress */}
                                        <div className="mt-6">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span>Tiến độ đăng ký</span>

                                                <span>
                                                    {approved}/{max}
                                                </span>
                                            </div>

                                            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                                                    style={{
                                                        width: `${percent}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Button */}
                                        <button
                                            disabled={hasRegister}
                                            onClick={() =>
                                                setConfirm({
                                                    type: "register",
                                                    item: p,
                                                })
                                            }
                                            className={`w-full mt-7 h-12 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                                                hasRegister
                                                    ? "bg-gray-300 cursor-not-allowed text-gray-600"
                                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                                            }`}
                                        >
                                            Đăng ký đề tài
                                            <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState
                        title="Chưa có đề tài khả dụng"
                        description="Hiện chưa có đề tài nào đang mở đăng ký."
                    />
                )}
            </div>

            {/* Modal xác nhận */}
            <ConfirmModal
                open={Boolean(confirm)}
                title={
                    confirm?.type === "register"
                        ? "Xác nhận đăng ký đề tài"
                        : "Xác nhận hủy đăng ký"
                }
                description={
                    confirm?.type === "register"
                        ? `Bạn sắp gửi yêu cầu đăng ký đề tài "${confirm?.item?.Title}". Yêu cầu sẽ được chuyển đến giảng viên hướng dẫn để xét duyệt.`
                        : "Bạn có chắc chắn muốn hủy đăng ký này không?"
                }
                confirmLabel={
                    confirm?.type === "register" ? "Gửi đăng ký" : "Hủy đăng ký"
                }
                loading={saving}
                onClose={() => {
                    setConfirm(null);
                    setNote("");
                }}
                onConfirm={submit}
            />

            {/* Form ghi chú */}
            {confirm?.type === "register" && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-2xl font-bold mb-2">
                            Gửi ghi chú cho giảng viên
                        </h2>

                        <p className="text-gray-500 mb-6">
                            Bạn có thể giới thiệu ngắn về bản thân hoặc nêu lý
                            do muốn thực hiện đề tài này.
                        </p>

                        <textarea
                            id="registration-note"
                            rows={6}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Ví dụ: Em đã có kinh nghiệm React, NodeJS và mong muốn phát triển đề tài này..."
                            className="w-full rounded-2xl border border-gray-300 p-4 outline-none resize-none focus:ring-2 focus:ring-blue-500"
                        />

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setConfirm(null);
                                    setNote("");
                                }}
                                className="px-6 h-11 rounded-xl border border-gray-300 hover:bg-gray-100 transition"
                            >
                                Đóng
                            </button>

                            <button
                                onClick={submit}
                                disabled={saving}
                                className="px-6 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-60"
                            >
                                {saving ? "Đang gửi..." : "Gửi đăng ký"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StudentProjectsPage;