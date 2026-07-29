import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";

import {
    getNotifications,
    getUnreadCount,
    markAllNotificationsRead,
    markNotificationRead,
} from "../api/notificationsApi";

function pathFor(notification, role) {
    if (notification.relatedEntityType === "SUBMISSION") {
        return role === "LECTURER"
            ? `/lecturer/submissions/${notification.relatedEntityId}/review`
            : `/student/submissions/${notification.relatedEntityId}/result`;
    }

    if (notification.relatedEntityType === "SUBMISSION_REQUIREMENT") {
        return role === "LECTURER"
            ? "/lecturer/submission-requirements"
            : `/student/submission-requirements/${notification.relatedEntityId}/submit`;
    }

    if (notification.relatedEntityType === "TOPIC_REGISTRATION") {
        return role === "LECTURER"
            ? "/lecturer/topic-registrations"
            : "/student/topic-registration";
    }

    if (notification.relatedEntityType === "STUDENT_GROUP") {
        return "/student/groups/my-group";
    }

    return null;
}

export default function NotificationBell({ role }) {
    const navigate = useNavigate();

    const [open, setOpen] = useState(false);
    const [count, setCount] = useState(0);
    const [items, setItems] = useState([]);
    const [error, setError] = useState("");

    const refresh = async () => {
        try {
            const [unread, list] = await Promise.all([
                getUnreadCount(),
                getNotifications(),
            ]);

            setCount(unread.data?.count || 0);
            setItems(list.data?.items || []);
            setError("");
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        refresh();

        const timer = setInterval(refresh, 60000);

        return () => clearInterval(timer);
    }, []);

    const handleSelect = async (notification) => {
        try {
            if (!notification.isRead) {
                await markNotificationRead(notification.id);
            }

            setOpen(false);

            await refresh();

            const path = pathFor(notification, role);

            if (path) {
                navigate(path);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleReadAll = async () => {
        try {
            await markAllNotificationsRead();
            refresh();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="relative">
            {/* Bell */}

            <button
                onClick={() => setOpen(!open)}
                className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm transition hover:bg-slate-100"
            >
                <Bell size={20} className="text-slate-700" />

                {count > 0 && (
                    <span className="absolute -right-1 -top-1 flex min-w-[20px] h-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {count > 99 ? "99+" : count}
                    </span>
                )}
            </button>

            {/* Panel */}

            {open && (
                <div className="absolute right-0 mt-3 w-[380px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl z-50">
                    {/* Header */}

                    <div className="flex items-center justify-between border-b px-5 py-4 bg-slate-50">
                        <h3 className="font-semibold text-slate-800">
                            Thông báo
                        </h3>

                        <button
                            onClick={handleReadAll}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
                        >
                            <CheckCheck size={16} />
                            Đọc tất cả
                        </button>
                    </div>

                    {/* Body */}

                    <div className="max-h-[420px] overflow-y-auto">
                        {error && (
                            <div className="p-4 text-sm text-red-500">
                                {error}
                            </div>
                        )}

                        {!items.length && (
                            <div className="py-10 text-center text-slate-500">
                                📭 Chưa có thông báo nào.
                            </div>
                        )}

                        {items.map((notification) => (
                            <button
                                key={notification.id}
                                onClick={() => handleSelect(notification)}
                                className={`w-full border-b p-4 text-left transition hover:bg-slate-50 ${
                                    notification.isRead
                                        ? "bg-white"
                                        : "bg-blue-50"
                                }`}
                            >
                                <div className="flex justify-between gap-3">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-slate-800">
                                            {notification.title}
                                        </h4>

                                        <p className="mt-1 text-sm text-slate-600">
                                            {notification.message}
                                        </p>

                                        <p className="mt-2 text-xs text-slate-400">
                                            {new Date(
                                                notification.createdAt,
                                            ).toLocaleString("vi-VN")}
                                        </p>
                                    </div>

                                    {!notification.isRead && (
                                        <span className="mt-2 h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
