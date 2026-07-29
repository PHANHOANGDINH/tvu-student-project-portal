import {
    LayoutDashboard,
    Users,
    GraduationCap,
    FolderKanban,
    ClipboardList,
    UserCircle,
    LogOut,
    ChevronRight,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const icons = {
    Dashboard: LayoutDashboard,
    "Người dùng": Users,
    "Lớp học": GraduationCap,
    "Đề tài của tôi": FolderKanban,
    "Danh sách đề tài": FolderKanban,
    "Dự án của tôi": FolderKanban,
    "Duyệt đăng ký": ClipboardList,
    "Tiến độ sinh viên": ClipboardList,
    "Nộp tiến độ": ClipboardList,
    "Bài nộp cuối kỳ": ClipboardList,
    "Nộp cuối kỳ": ClipboardList,
    "Hồ sơ": UserCircle,
};

export default function Sidebar({
    menuItems,
    role,
    user,
    onLogout,
    onHomeClick,
}) {
    return (
        <aside className="w-72 h-screen sticky top-0 bg-slate-950 text-white flex flex-col border-r border-slate-800">
            {/* Logo */}
            <div
                onClick={onHomeClick}
                className="h-24 flex items-center px-6 border-b border-slate-800 cursor-pointer hover:bg-slate-900 transition"
            >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                    <span className="font-bold text-lg">TVU</span>
                </div>

                <div className="ml-4">
                    <h2 className="text-lg font-bold tracking-wide">
                        Project Portal
                    </h2>

                    <p className="text-xs text-slate-400">Student Management</p>
                </div>
            </div>

            {/* Menu */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <p className="text-xs uppercase tracking-widest text-slate-500 px-4 mb-4">
                    Navigation
                </p>

                <div className="space-y-2">
                    {menuItems.map((item) => {
                        const Icon = icons[item.label] || LayoutDashboard;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `group flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-300

                                    ${
                                        isActive
                                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20"
                                            : "hover:bg-slate-800"
                                    }`
                                }
                            >
                                <div className="flex items-center gap-4">
                                    <Icon
                                        size={20}
                                        className="group-hover:scale-110 transition"
                                    />

                                    <span className="font-medium">
                                        {item.label}
                                    </span>
                                </div>

                                <ChevronRight
                                    size={16}
                                    className="opacity-0 group-hover:opacity-100 transition"
                                />
                            </NavLink>
                        );
                    })}
                </div>
            </div>

            {/* User */}
            <div className="p-5 border-t border-slate-800">
                <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                    <div className="flex items-center">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-lg ring-4 ring-slate-800">
                                {(
                                    user?.fullName ||
                                    user?.FullName ||
                                    user?.email ||
                                    "U"
                                )
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>

                            <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900"></span>
                        </div>

                        <div className="ml-4">
                            <h3 className="font-semibold text-white">
                                {user?.fullName ||
                                    user?.FullName ||
                                    "Người dùng"}
                            </h3>

                            <p className="text-sm text-slate-400">{role}</p>
                        </div>
                    </div>

                    <button
                        onClick={onLogout}
                        className="mt-5 w-full rounded-xl bg-red-500 hover:bg-red-600 py-3 flex items-center justify-center gap-2 font-medium transition-all duration-300 hover:scale-[1.02]"
                    >
                        <LogOut size={18} />
                        Đăng xuất
                    </button>
                </div>
            </div>
        </aside>
    );
}
