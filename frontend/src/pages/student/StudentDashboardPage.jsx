import { useEffect, useState } from "react";
import {
    BookOpen,
    CheckCircle2,
    FileCheck2,
    FolderKanban,
    ListChecks,
    ArrowRight,
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
            {/* HERO */}

            <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-8 shadow-xl">
                <h1 className="text-3xl font-bold">Xin chào 👋</h1>

                <p className="mt-2 text-blue-100">
                    Theo dõi toàn bộ tiến độ thực hiện đồ án của bạn tại đây.
                </p>
            </div>

            {/* STAT */}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
                {stats.map((item) => {
                    const Icon = item.icon;

                    return (
                        <div
                            key={item.title}
                            className="bg-white rounded-2xl shadow hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-6"
                        >
                            <div
                                className={`w-14 h-14 rounded-xl bg-gradient-to-r ${item.color} flex items-center justify-center text-white mb-4`}
                            >
                                <Icon size={28} />
                            </div>

                            <p className="text-gray-500 text-sm">
                                {item.title}
                            </p>

                            <h2 className="text-3xl font-bold mt-1">
                                {item.value}
                            </h2>

                            <p className="text-gray-400 text-sm mt-2">
                                {item.desc}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* CONTENT */}

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Activity */}

                <div className="lg:col-span-2 bg-white rounded-2xl shadow p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-bold text-xl">Hoạt động gần đây</h2>
                    </div>

                    {recent.length ? (
                        <div className="space-y-5">
                            {recent.map((item) => (
                                <div
                                    key={`${item.Title}-${item.Id}`}
                                    className="flex justify-between items-center border-l-4 border-blue-500 pl-4 hover:bg-gray-50 rounded-lg py-2 transition"
                                >
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
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="Chưa có hoạt động"
                            description="Các báo cáo và bài nộp sẽ hiển thị ở đây."
                        />
                    )}
                </div>

                {/* Quick */}

                <div className="bg-white rounded-2xl shadow p-6">
                    <h2 className="text-xl font-bold mb-6">Thao tác nhanh</h2>

                    <div className="space-y-4">
                        <Link
                            to="/student/topic-registration"
                            className="flex justify-between items-center rounded-xl bg-blue-50 hover:bg-blue-100 p-4 transition"
                        >
                            Đăng ký đề tài
                            <ArrowRight size={18} />
                        </Link>

                        <Link
                            to="/student/progress"
                            className="flex justify-between items-center rounded-xl bg-green-50 hover:bg-green-100 p-4 transition"
                        >
                            Nộp báo cáo tiến độ
                            <ArrowRight size={18} />
                        </Link>

                        <Link
                            to="/student/final-submissions"
                            className="flex justify-between items-center rounded-xl bg-orange-50 hover:bg-orange-100 p-4 transition"
                        >
                            Nộp bài cuối kỳ
                            <ArrowRight size={18} />
                        </Link>

                        <Link
                            to="/student/profile"
                            className="flex justify-between items-center rounded-xl bg-purple-50 hover:bg-purple-100 p-4 transition"
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
