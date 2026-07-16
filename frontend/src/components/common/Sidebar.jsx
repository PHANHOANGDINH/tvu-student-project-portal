import {
    LayoutDashboard,
    Users,
    GraduationCap,
    FolderKanban,
    ClipboardList,
    UserCircle,
    LogOut,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const icons = {
    "Tổng quan": LayoutDashboard,
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
        <aside className="w-72 min-h-screen bg-slate-900 text-white flex flex-col shadow-2xl">
            {/* Logo */}

            <div
                onClick={onHomeClick}
                className="h-24 border-b border-slate-800 flex items-center px-6 cursor-pointer hover:bg-slate-800 transition"
            >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-bold text-xl shadow-lg">
                    TVU
                </div>

                <div className="ml-4">
                    <h2 className="font-bold text-xl">Project Portal</h2>

                    <p className="text-slate-400 text-sm">
                        Quản lý dự án sinh viên
                    </p>
                </div>
            </div>

            {/* Menu */}

            <div className="flex-1 p-4">
                <p className="uppercase text-xs text-slate-500 mb-3 px-2">
                    Menu
                </p>

                <div className="space-y-2">
                    {menuItems.map((item) => {
                        const Icon = icons[item.label] || LayoutDashboard;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-300

                                    ${
                                        isActive
                                            ? "bg-blue-600 shadow-lg"
                                            : "hover:bg-slate-800"
                                    }`
                                }
                            >
                                <Icon size={21} />

                                <span className="font-medium">
                                    {item.label}
                                </span>
                            </NavLink>
                        );
                    })}
                </div>
            </div>

            {/* User */}

            <div className="border-t border-slate-800 p-5">
                <div className="rounded-2xl bg-slate-800 p-4">
                    <div className="flex items-center">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-lg font-bold">
                            {(
                                user?.fullName ||
                                user?.FullName ||
                                user?.email ||
                                "N"
                            )
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div className="ml-3">
                            <h3 className="font-semibold">
                                {user?.fullName ||
                                    user?.FullName ||
                                    "Người dùng"}
                            </h3>

                            <p className="text-slate-400 text-sm">{role}</p>
                        </div>
                    </div>

                    <button
                        onClick={onLogout}
                        className="mt-5 w-full bg-red-500 hover:bg-red-600 rounded-xl py-3 flex items-center justify-center gap-2 transition"
                    >
                        <LogOut size={18} />
                        Đăng xuất
                    </button>
                </div>
            </div>
        </aside>
    );
}
