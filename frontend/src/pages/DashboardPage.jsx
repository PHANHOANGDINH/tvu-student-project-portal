import { useEffect, useMemo, useState } from "react";
import { getClassesApi, getDashboardApi, getUsersApi } from '../api/adminApi'
import { normalizeRole, USER_ROLES } from '../constants/roles'
import {
    FaUsers,
    FaUserGraduate,
    FaChalkboardTeacher,
    FaUserShield,
    FaSchool,
    FaLock,
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
            setError(err.message || "Không thể tải dữ liệu dashboard");
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
            users.filter((user) => normalizeRole(user.Role) === USER_ROLES.STUDENT).length;

        const totalTeachers =
            dashboard?.totalTeachers ||
            dashboard?.TotalTeachers ||
            users.filter((user) => normalizeRole(user.Role) === USER_ROLES.LECTURER).length;

        const totalAdmins =
            dashboard?.totalAdmins ||
            dashboard?.TotalAdmins ||
            users.filter((user) => normalizeRole(user.Role) === USER_ROLES.ADMIN).length;

        const totalActiveUsers =
            dashboard?.totalActiveUsers ||
            dashboard?.TotalActiveUsers ||
            users.filter((user) => user.IsActive !== false).length;

        const totalInactiveUsers =
            dashboard?.totalInactiveUsers ||
            dashboard?.TotalInactiveUsers ||
            users.filter((user) => user.IsActive === false).length;

        const totalClasses =
            dashboard?.totalClasses ||
            dashboard?.TotalClasses ||
            classes.length;

        const totalActiveClasses =
            dashboard?.totalActiveClasses ||
            dashboard?.TotalActiveClasses ||
            classes.filter((item) => item.IsActive !== false).length;

        const totalInactiveClasses =
            dashboard?.totalInactiveClasses ||
            dashboard?.TotalInactiveClasses ||
            classes.filter((item) => item.IsActive === false).length;

        const assignedStudents = users.filter((user) => {
            if (normalizeRole(user.Role) !== USER_ROLES.STUDENT) return false;

            return (
                !!user.ActiveClassId ||
                !!user.ActiveClassCode ||
                !!user.ActiveClassName
            );
        }).length;

        const unassignedStudents = users.filter((user) => {
            if (normalizeRole(user.Role) !== USER_ROLES.STUDENT) return false;

            return (
                !user.ActiveClassId &&
                !user.ActiveClassCode &&
                !user.ActiveClassName
            );
        }).length;

        const totalStudentsInClasses = classes.reduce((sum, item) => {
            return sum + Number(item.TotalStudents || 0);
        }, 0);

        return {
            totalUsers,
            totalStudents,
            totalTeachers,
            totalAdmins,
            totalActiveUsers,
            totalInactiveUsers,
            totalClasses,
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
            case USER_ROLES.ADMIN:
                return "Admin";
            case USER_ROLES.LECTURER:
                return "Giảng viên";
            case USER_ROLES.STUDENT:
                return "Sinh viên";
            default:
                return role || "-";
        }
    }

    function getStatusClass(isActive) {
        return isActive === false ? "badge" : "badge green";
    }

    function getStatusText(isActive) {
        return isActive === false ? "Đã khóa" : "Hoạt động";
    }

    if (loading) {
        return (
            <div>
                <div className="page-title">
                    <h2>Dashboard</h2>
                    <p>Đang tải dữ liệu tổng quan...</p>
                </div>

                <div className="panel">
                    <p>Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-title row-between">
                <div>
                    <h2>Dashboard Admin</h2>
                    <p>Tổng quan hệ thống TVU Student Project Portal.</p>
                </div>

                <button className="btn-light" onClick={loadDashboard}>
                    Làm mới
                </button>
            </div>

            {error && <div className="alert error">{error}</div>}

            <div className="dashboard-stat-grid">
                <div className="stat-card blue">
                    <div className="stat-icon">
                        <FaUsers />
                    </div>

                    <div>
                        <span>Tổng người dùng</span>
                        <strong>{stats.totalUsers}</strong>
                        <p>Tất cả tài khoản trong hệ thống</p>
                    </div>
                </div>

                <div className="stat-card green">
                    <div className="stat-icon">
                        <FaUserGraduate />
                    </div>

                    <div>
                        <span>Sinh viên</span>
                        <strong>{stats.totalStudents}</strong>
                        <p>Tài khoản sinh viên</p>
                    </div>
                </div>

                <div className="stat-card orange">
                    <div className="stat-icon">
                        <FaChalkboardTeacher />
                    </div>

                    <div>
                        <span>Giảng viên</span>
                        <strong>{stats.totalTeachers}</strong>
                        <p>Giảng viên hướng dẫn</p>
                    </div>
                </div>

                <div className="stat-card purple">
                    <div className="stat-icon">
                        <FaUserShield />
                    </div>

                    <div>
                        <span>Quản trị viên</span>
                        <strong>{stats.totalAdmins}</strong>
                        <p>Tài khoản quản trị</p>
                    </div>
                </div>

                <div className="stat-card cyan">
                    <div className="stat-icon">
                        <FaSchool />
                    </div>

                    <div>
                        <span>Lớp học</span>
                        <strong>{stats.totalClasses}</strong>
                        <p>Lớp đang quản lý</p>
                    </div>
                </div>

                <div className="stat-card red">
                    <div className="stat-icon">
                        <FaLock />
                    </div>

                    <div>
                        <span>Tài khoản khóa</span>
                        <strong>{stats.totalInactiveUsers}</strong>
                        <p>Đang bị vô hiệu hóa</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="panel">
                    <h3>Trạng thái tài khoản</h3>

                    <div className="mini-stat-list">
                        <div>
                            <span>Đang hoạt động</span>
                            <strong>{stats.totalActiveUsers}</strong>
                        </div>

                        <div>
                            <span>Bị khóa</span>
                            <strong>{stats.totalInactiveUsers}</strong>
                        </div>

                        <div>
                            <span>Tổng tài khoản</span>
                            <strong>{stats.totalUsers}</strong>
                        </div>
                    </div>
                </div>

                <div className="panel">
                    <h3>Trạng thái lớp học</h3>

                    <div className="mini-stat-list">
                        <div>
                            <span>Lớp hoạt động</span>
                            <strong>{stats.totalActiveClasses}</strong>
                        </div>

                        <div>
                            <span>Lớp bị khóa</span>
                            <strong>{stats.totalInactiveClasses}</strong>
                        </div>

                        <div>
                            <span>Tổng lớp</span>
                            <strong>{stats.totalClasses}</strong>
                        </div>
                    </div>
                </div>

                <div className="panel">
                    <h3>Xếp lớp sinh viên</h3>

                    <div className="mini-stat-list">
                        <div>
                            <span>Đã thuộc lớp</span>
                            <strong>{stats.assignedStudents}</strong>
                        </div>

                        <div>
                            <span>Chưa thuộc lớp</span>
                            <strong>{stats.unassignedStudents}</strong>
                        </div>

                        <div>
                            <span>Tổng sinh viên trong lớp</span>
                            <strong>{stats.totalStudentsInClasses}</strong>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="panel">
                    <h3>Lớp có nhiều sinh viên nhất</h3>

                    <table>
                        <thead>
                            <tr>
                                <th>Mã lớp</th>
                                <th>Tên lớp</th>
                                <th>Số SV</th>
                            </tr>
                        </thead>

                        <tbody>
                            {topClasses.map((item) => (
                                <tr key={item.Id}>
                                    <td>{item.ClassCode || "-"}</td>
                                    <td>{item.ClassName || "-"}</td>
                                    <td>{item.TotalStudents || 0}</td>
                                </tr>
                            ))}

                            {topClasses.length === 0 && (
                                <tr>
                                    <td colSpan="3">
                                        Chưa có dữ liệu lớp học.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="panel">
                    <h3>Người dùng mới tạo</h3>

                    <table>
                        <thead>
                            <tr>
                                <th>Họ tên</th>
                                <th>Vai trĂ²</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>

                        <tbody>
                            {recentUsers.map((user) => (
                                <tr key={user.Id}>
                                    <td>
                                        <strong>{user.FullName || "-"}</strong>
                                        <br />
                                        <span className="muted-text">
                                            {user.Email || "-"}
                                        </span>
                                    </td>

                                    <td>
                                        <span className="badge blue">
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
                            ))}

                            {recentUsers.length === 0 && (
                                <tr>
                                    <td colSpan="3">
                                        Chưa có dữ liệu người dùng.
                                    </td>
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
