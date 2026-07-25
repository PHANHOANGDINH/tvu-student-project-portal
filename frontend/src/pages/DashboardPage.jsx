import { useEffect, useMemo, useState } from "react";
import { getDashboardApi, getUsersApi, getClassesApi } from "../api/adminApi";

import {
    FaUsers,
    FaUserGraduate,
    FaChalkboardTeacher,
    FaUserShield,
    FaSchool,
    FaLock,
    FaSyncAlt,
} from "react-icons/fa";

import "../dashboard.css";

function DashboardPage() {
    const [dashboard, setDashboard] = useState(null);
    const [users, setUsers] = useState([]);
    const [classes, setClasses] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        try {
            setLoading(true);
            setError("");

            const [dashboardResponse, usersResponse, classesResponse] =
                await Promise.all([
                    getDashboardApi().catch(() => null),
                    getUsersApi(),
                    getClassesApi(),
                ]);

            setDashboard(dashboardResponse?.data || dashboardResponse || null);

            const userList = usersResponse?.data || [];
            const classList = classesResponse?.data || [];

            setUsers(Array.isArray(userList) ? userList : []);
            setClasses(Array.isArray(classList) ? classList : []);
        } catch (err) {
            setError(err.message || "Không thể tải dữ liệu Dashboard.");
        } finally {
            setLoading(false);
        }
    }
    const stats = useMemo(() => {
        const totalUsers =
            dashboard?.totalUsers ||
            dashboard?.TotalUsers ||
            dashboard?.tongNguoiDung ||
            users.length;

        const totalStudents =
            dashboard?.totalStudents ||
            dashboard?.TotalStudents ||
            users.filter((u) => u.Role === "Student").length;

        const totalTeachers =
            dashboard?.totalTeachers ||
            dashboard?.TotalTeachers ||
            users.filter((u) => u.Role === "Teacher").length;

        const totalAdmins =
            dashboard?.totalAdmins ||
            dashboard?.TotalAdmins ||
            users.filter((u) => u.Role === "Admin").length;

        const totalClasses =
            dashboard?.totalClasses ||
            dashboard?.TotalClasses ||
            classes.length;

        const totalActiveUsers =
            dashboard?.totalActiveUsers ||
            dashboard?.TotalActiveUsers ||
            users.filter((u) => u.IsActive !== false).length;

        const totalInactiveUsers =
            dashboard?.totalInactiveUsers ||
            dashboard?.TotalInactiveUsers ||
            users.filter((u) => u.IsActive === false).length;

        const totalActiveClasses =
            dashboard?.totalActiveClasses ||
            dashboard?.TotalActiveClasses ||
            classes.filter((c) => c.IsActive !== false).length;

        const totalInactiveClasses =
            dashboard?.totalInactiveClasses ||
            dashboard?.TotalInactiveClasses ||
            classes.filter((c) => c.IsActive === false).length;

        const assignedStudents = users.filter((u) => {
            if (u.Role !== "Student") return false;

            return (
                !!u.ActiveClassId || !!u.ActiveClassCode || !!u.ActiveClassName
            );
        }).length;

        const unassignedStudents = users.filter((u) => {
            if (u.Role !== "Student") return false;

            return !u.ActiveClassId && !u.ActiveClassCode && !u.ActiveClassName;
        }).length;

        const totalStudentsInClasses = classes.reduce((sum, item) => {
            return sum + Number(item.TotalStudents || 0);
        }, 0);

        return {
            totalUsers,
            totalStudents,
            totalTeachers,
            totalAdmins,

            totalClasses,

            totalActiveUsers,
            totalInactiveUsers,

            totalActiveClasses,
            totalInactiveClasses,

            assignedStudents,
            unassignedStudents,

            totalStudentsInClasses,
        };
    }, [dashboard, users, classes]);

    const recentUsers = useMemo(() => {
        return [...users]
            .sort(
                (a, b) =>
                    new Date(b.CreatedAt || 0) - new Date(a.CreatedAt || 0),
            )
            .slice(0, 5);
    }, [users]);

    const topClasses = useMemo(() => {
        return [...classes]
            .sort(
                (a, b) =>
                    Number(b.TotalStudents || 0) - Number(a.TotalStudents || 0),
            )
            .slice(0, 5);
    }, [classes]);

    function getRoleText(role) {
        switch (role) {
            case "Admin":
                return "Admin";

            case "Teacher":
                return "Giảng viên";

            case "Student":
                return "Sinh viên";

            default:
                return role || "-";
        }
    }

    function getStatusText(isActive) {
        return isActive === false ? "Đã khóa" : "Hoạt động";
    }

    function getStatusClass(isActive) {
        return isActive === false ? "status inactive" : "status active";
    }

    if (loading) {
        return (
            <div className="loading-page">
                <h2>Đang tải Dashboard...</h2>
            </div>
        );
    }
    return (
        <div className="dashboard-container">
            {/* ================= HEADER ================= */}

            <div className="dashboard-header">
                <div>
                    <h1>Dashboard Admin 👋</h1>

                    <p>
                        Chào mừng trở lại, quản trị viên. Đây là tổng quan toàn
                        bộ hệ thống quản lý đồ án.
                    </p>
                </div>

                <button className="refresh-btn" onClick={loadDashboard}>
                    <FaSyncAlt />
                    <span>Làm mới</span>
                </button>
            </div>

            {error && <div className="alert error">{error}</div>}

            {/* ================= CARDS ================= */}

            <div className="dashboard-stat-grid">
                <div className="stat-card blue">
                    <div className="stat-icon">
                        <FaUsers />
                    </div>

                    <div className="stat-content">
                        <span>Tổng người dùng</span>

                        <h2>{stats.totalUsers}</h2>

                        <small>Toàn bộ tài khoản hệ thống</small>
                    </div>
                </div>

                <div className="stat-card green">
                    <div className="stat-icon">
                        <FaUserGraduate />
                    </div>

                    <div className="stat-content">
                        <span>Sinh viên</span>

                        <h2>{stats.totalStudents}</h2>

                        <small>Đang học trong hệ thống</small>
                    </div>
                </div>

                <div className="stat-card orange">
                    <div className="stat-icon">
                        <FaChalkboardTeacher />
                    </div>

                    <div className="stat-content">
                        <span>Giảng viên</span>

                        <h2>{stats.totalTeachers}</h2>

                        <small>Hướng dẫn đồ án</small>
                    </div>
                </div>

                <div className="stat-card purple">
                    <div className="stat-icon">
                        <FaUserShield />
                    </div>

                    <div className="stat-content">
                        <span>Quản trị viên</span>

                        <h2>{stats.totalAdmins}</h2>

                        <small>Administrator</small>
                    </div>
                </div>

                <div className="stat-card cyan">
                    <div className="stat-icon">
                        <FaSchool />
                    </div>

                    <div className="stat-content">
                        <span>Lớp học</span>

                        <h2>{stats.totalClasses}</h2>

                        <small>Đang quản lý</small>
                    </div>
                </div>

                <div className="stat-card red">
                    <div className="stat-icon">
                        <FaLock />
                    </div>

                    <div className="stat-content">
                        <span>Tài khoản khóa</span>

                        <h2>{stats.totalInactiveUsers}</h2>

                        <small>Không thể đăng nhập</small>
                    </div>
                </div>
            </div>

            {/* ================= THỐNG KÊ ================= */}

            <div className="dashboard-row">
                <div className="dashboard-box">
                    <h3>📊 Thống kê tài khoản</h3>

                    <div className="mini-item">
                        <span>Đang hoạt động</span>

                        <strong>{stats.totalActiveUsers}</strong>
                    </div>

                    <div className="progress">
                        <div
                            className="progress-blue"
                            style={{
                                width:
                                    stats.totalUsers === 0
                                        ? "0%"
                                        : `${
                                              (stats.totalActiveUsers /
                                                  stats.totalUsers) *
                                              100
                                          }%`,
                            }}
                        />
                    </div>

                    <div className="mini-item">
                        <span>Bị khóa</span>

                        <strong>{stats.totalInactiveUsers}</strong>
                    </div>

                    <div className="progress">
                        <div
                            className="progress-red"
                            style={{
                                width:
                                    stats.totalUsers === 0
                                        ? "0%"
                                        : `${
                                              (stats.totalInactiveUsers /
                                                  stats.totalUsers) *
                                              100
                                          }%`,
                            }}
                        />
                    </div>
                </div>

                <div className="dashboard-box">
                    <h3>🏫 Thống kê lớp học</h3>

                    <div className="mini-item">
                        <span>Lớp hoạt động</span>

                        <strong>{stats.totalActiveClasses}</strong>
                    </div>

                    <div className="progress">
                        <div
                            className="progress-green"
                            style={{
                                width:
                                    stats.totalClasses === 0
                                        ? "0%"
                                        : `${
                                              (stats.totalActiveClasses /
                                                  stats.totalClasses) *
                                              100
                                          }%`,
                            }}
                        />
                    </div>

                    <div className="mini-item">
                        <span>Lớp khóa</span>

                        <strong>{stats.totalInactiveClasses}</strong>
                    </div>

                    <div className="progress">
                        <div
                            className="progress-orange"
                            style={{
                                width:
                                    stats.totalClasses === 0
                                        ? "0%"
                                        : `${
                                              (stats.totalInactiveClasses /
                                                  stats.totalClasses) *
                                              100
                                          }%`,
                            }}
                        />
                    </div>
                </div>
            </div>
            {/* ================= XẾP LỚP SINH VIÊN ================= */}

            <div className="dashboard-box full-width">
                <h3>👨‍🎓 Thống kê sinh viên</h3>

                <div className="three-column">
                    <div className="info-card">
                        <span>Đã thuộc lớp</span>

                        <h2>{stats.assignedStudents}</h2>
                    </div>

                    <div className="info-card">
                        <span>Chưa thuộc lớp</span>

                        <h2>{stats.unassignedStudents}</h2>
                    </div>

                    <div className="info-card">
                        <span>Tổng SV trong lớp</span>

                        <h2>{stats.totalStudentsInClasses}</h2>
                    </div>
                </div>
            </div>

            {/* ================= TABLE ================= */}

            <div className="table-grid">
                <div className="table-card">
                    <div className="table-header">
                        <h3>🏫 Lớp có nhiều sinh viên nhất</h3>
                    </div>

                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Mã lớp</th>

                                <th>Tên lớp</th>

                                <th>Số SV</th>
                            </tr>
                        </thead>

                        <tbody>
                            {topClasses.length > 0 ? (
                                topClasses.map((item) => (
                                    <tr key={item.Id}>
                                        <td>{item.ClassCode || "-"}</td>

                                        <td>{item.ClassName || "-"}</td>

                                        <td>
                                            <span className="badge blue">
                                                {item.TotalStudents || 0}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3">Chưa có dữ liệu.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="table-card">
                    <div className="table-header">
                        <h3>👥 Người dùng mới</h3>
                    </div>

                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Họ tên</th>

                                <th>Vai trò</th>

                                <th>Trạng thái</th>
                            </tr>
                        </thead>

                        <tbody>
                            {recentUsers.length > 0 ? (
                                recentUsers.map((user) => (
                                    <tr key={user.Id}>
                                        <td>
                                            <div className="user-info">
                                                <div className="avatar">
                                                    {(user.FullName || "U")

                                                        .charAt(0)

                                                        .toUpperCase()}
                                                </div>

                                                <div>
                                                    <strong>
                                                        {user.FullName || "-"}
                                                    </strong>

                                                    <br />

                                                    <small>
                                                        {user.Email || "-"}
                                                    </small>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <span className="badge role">
                                                {getRoleText(user.Role)}
                                            </span>
                                        </td>

                                        <td>
                                            <span
                                                className={getStatusClass(
                                                    user.IsActive,
                                                )}
                                            >
                                                {getStatusText(user.IsActive)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3">Chưa có dữ liệu.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
export default DashboardPage;
