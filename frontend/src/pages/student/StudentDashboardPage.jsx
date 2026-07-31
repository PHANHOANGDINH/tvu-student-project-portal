import { useEffect, useState } from "react";
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    FileCheck2,
    FolderKanban,
    ListChecks,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
    getStudentFinalsApi,
    getStudentProgressApi,
    getStudentProjectsApi,
    getStudentRegistrationsApi,
} from "../../api/studentApi";
import {
    EmptyState,
    ErrorState,
    LoadingState,
    StatusBadge,
} from "../../components/common/UiState";

function StudentDashboardPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function load() {
        try {
            setLoading(true);
            setError("");

            const [projects, registrations, progress, finals] =
                await Promise.all([
                    getStudentProjectsApi({ limit: 100 }),
                    getStudentRegistrationsApi({ limit: 100 }),
                    getStudentProgressApi({ limit: 100 }),
                    getStudentFinalsApi({ limit: 100 }),
                ]);

            setData({
                projects: projects?.data || [],
                registrations: registrations?.data || [],
                progress: progress?.data || [],
                finals: finals?.data || [],
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    if (loading)
        return <LoadingState label="Đang chuẩn bị không gian sinh viên..." />;

    if (error) return <ErrorState message={error} onRetry={load} />;

    const approved = data.registrations.filter((x) => x.Status === "Approved");

    const recent = [...data.progress, ...data.finals]
        .sort(
            (a, b) =>
                new Date(b.CreatedAt || b.SubmittedAt) -
                new Date(a.CreatedAt || a.SubmittedAt),
        )
        .slice(0, 5);

    const stats = [
        {
            icon: BookOpen,
            title: "Đề tài khả dụng",
            value: data.projects.length,
            desc: "Đề tài đang mở",
            color: "from-blue-500 to-cyan-500",
        },
        {
            icon: FolderKanban,
            title: "Đăng ký",
            value: data.registrations.length,
            desc: "Tổng lượt đăng ký",
            color: "from-purple-500 to-indigo-500",
        },
        {
            icon: CheckCircle2,
            title: "Đã duyệt",
            value: approved.length,
            desc: "Đang thực hiện",
            color: "from-green-500 to-emerald-500",
        },
        {
            icon: ListChecks,
            title: "Tiến độ",
            value: data.progress.length,
            desc: "Báo cáo đã gửi",
            color: "from-orange-500 to-amber-500",
        },
        {
            icon: FileCheck2,
            title: "Cuối kỳ",
            value: data.finals.length,
            desc: "Bài đã nộp",
            color: "from-pink-500 to-rose-500",
        },
    ];

    return (
        <div className="space-y-8">
            {/* HERO BANNER */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 p-8 text-white shadow-2xl">
                <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-36 w-36 rounded-full bg-cyan-300/20 blur-3xl" />

                <div className="relative flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold">Xin chào 👋</h1>

                        <p className="mt-3 text-blue-100">
                            Chào mừng quay trở lại hệ thống quản lý đồ án sinh
                            viên.
                        </p>

                        <p className="mt-2 text-sm text-blue-200">
                            Theo dõi tiến độ và các bài nộp của bạn ngay tại
                            đây.
                        </p>
                    </div>

                    <div className="hidden lg:block rounded-2xl bg-white/10 px-6 py-5 backdrop-blur">
                        <p className="text-sm text-blue-100">
                            Đề tài đang thực hiện
                        </p>

                        <h2 className="mt-2 text-2xl font-bold">
                            {approved.length
                                ? approved[0].ProjectTitle || "Đang cập nhật"
                                : "Chưa có"}
                        </h2>
                    </div>
                </div>
            </div>

            {/* STAT CARDS */}
            <div
                key={item.title}
                className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">{item.title}</p>

                        <h2 className="mt-2 text-4xl font-bold">
                            {item.value}
                        </h2>

                        <p className="mt-2 text-sm text-gray-400">
                            {item.desc}
                        </p>
                    </div>

                    <div
                        className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r ${item.color} text-white shadow-lg transition group-hover:scale-110`}
                    >
                        <Icon size={30} />
                    </div>
                </div>
            </div>
            <div className="rounded-3xl bg-white p-7 shadow">
                <div className="flex justify-between">
                    <div>
                        <h2 className="text-xl font-bold">Tiến độ đồ án</h2>

                        <p className="text-gray-500">
                            Mức độ hoàn thành hiện tại
                        </p>
                    </div>

                    <h2 className="text-3xl font-bold text-blue-600">
                        {Math.min(
                            100,
                            Math.round(
                                ((data.progress.length + data.finals.length) /
                                    10) *
                                    100,
                            ),
                        )}
                        %
                    </h2>
                </div>

                <div className="mt-5 h-4 rounded-full bg-gray-100">
                    <div
                        className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        style={{
                            width: `${Math.min(
                                100,
                                ((data.progress.length + data.finals.length) /
                                    10) *
                                    100,
                            )}%`,
                        }}
                    />
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Activity Section */}
                <div className="space-y-6">
                    {recent.map((item) => (
                        <div
                            key={`${item.Title}-${item.Id}`}
                            className="relative flex gap-5"
                        >
                            <div className="flex flex-col items-center">
                                <div className="h-4 w-4 rounded-full bg-blue-600" />

                                <div className="mt-1 h-full w-px bg-gray-200" />
                            </div>

                            <div className="flex-1 rounded-2xl border p-5 hover:bg-gray-50 transition">
                                <div className="flex justify-between">
                                    <div>
                                        <h3 className="font-semibold">
                                            {item.Title}
                                        </h3>

                                        <p className="text-sm text-gray-500">
                                            {item.ProjectTitle ||
                                                "Đồ án sinh viên"}
                                        </p>
                                    </div>

                                    <StatusBadge status={item.Status} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Links Section */}
                <div className="bg-white rounded-2xl shadow p-6">
                    <h2 className="text-xl font-bold mb-6">Thao tác nhanh</h2>

                    <div className="space-y-4">
                        <Link
                            to="/student/topic-registration"
                            className="flex justify-between items-center rounded-xl bg-blue-50 hover:bg-blue-100 p-4 transition text-blue-900 font-medium"
                        >
                            Đăng ký đề tài
                            <ArrowRight size={18} />
                        </Link>

                        <Link
                            to="/student/progress"
                            className="flex justify-between items-center rounded-xl bg-green-50 hover:bg-green-100 p-4 transition text-green-900 font-medium"
                        >
                            Nộp báo cáo tiến độ
                            <ArrowRight size={18} />
                        </Link>

                        <Link
                            to="/student/final-submissions"
                            className="flex justify-between items-center rounded-xl bg-orange-50 hover:bg-orange-100 p-4 transition text-orange-900 font-medium"
                        >
                            Nộp bài cuối kỳ
                            <ArrowRight size={18} />
                        </Link>

                        <Link
                            to="/student/profile"
                            className="flex justify-between items-center rounded-xl bg-purple-50 hover:bg-purple-100 p-4 transition text-purple-900 font-medium"
                        >
                            Hồ sơ cá nhân
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentDashboardPage;
