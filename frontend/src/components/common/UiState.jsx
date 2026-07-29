import { AlertCircle, Inbox, LoaderCircle, RefreshCw } from "lucide-react";

/* ---------------- Loading ---------------- */

export function LoadingState({ label = "Đang tải dữ liệu..." }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-5 rounded-full bg-blue-100 p-5">
                <LoaderCircle
                    size={36}
                    className="animate-spin text-blue-600"
                />
            </div>

            <h3 className="text-lg font-semibold text-slate-800">{label}</h3>

            <p className="mt-2 text-sm text-slate-500">
                Vui lòng chờ trong giây lát...
            </p>
        </div>
    );
}

/* ---------------- Empty ---------------- */

export function EmptyState({
    title = "Chưa có dữ liệu",
    description = "Dữ liệu sẽ xuất hiện tại đây khi có thông tin.",
    action,
}) {
    return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                <Inbox size={36} className="text-slate-500" />
            </div>

            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>

            <p className="mx-auto mt-2 max-w-md text-slate-500">
                {description}
            </p>

            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}

/* ---------------- Error ---------------- */

export function ErrorState({ message, onRetry }) {
    return (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                <AlertCircle size={38} className="text-red-600" />
            </div>

            <h3 className="text-lg font-semibold text-red-700">
                Không thể tải dữ liệu
            </h3>

            <p className="mt-2 text-red-600">{message}</p>

            {onRetry && (
                <button
                    onClick={onRetry}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-medium text-white transition hover:bg-red-700"
                >
                    <RefreshCw size={18} />
                    Tải lại
                </button>
            )}
        </div>
    );
}

/* ---------------- Badge ---------------- */

export function StatusBadge({ status }) {
    const value = String(status || "Unknown");

    const map = {
        Approved: {
            label: "Đã duyệt",
            style: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
        },

        Pending: {
            label: "Chờ duyệt",
            style: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
        },

        Rejected: {
            label: "Từ chối",
            style: "bg-red-100 text-red-700 ring-1 ring-red-200",
        },

        Cancelled: {
            label: "Đã hủy",
            style: "bg-slate-200 text-slate-700 ring-1 ring-slate-300",
        },

        Submitted: {
            label: "Đã nộp",
            style: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
        },

        Reviewed: {
            label: "Đã nhận xét",
            style: "bg-green-100 text-green-700 ring-1 ring-green-200",
        },

        Draft: {
            label: "Bản nháp",
            style: "bg-gray-100 text-gray-700 ring-1 ring-gray-300",
        },
    };

    const badge = map[value] || {
        label: value,
        style: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badge.style}`}
        >
            {badge.label}
        </span>
    );
}
