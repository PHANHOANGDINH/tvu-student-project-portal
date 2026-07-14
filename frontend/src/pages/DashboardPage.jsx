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
            setError(err.message || "KhĂ´ng thá»ƒ táº£i dá»¯ liá»‡u dashboard");
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
                return "Giáº£ng viĂªn";
            case USER_ROLES.STUDENT:
                return "Sinh viĂªn";
            default:
                return role || "-";
        }
    }

    function getStatusClass(isActive) {
        return isActive === false ? "badge" : "badge green";
    }

    function getStatusText(isActive) {
        return isActive === false ? "ÄĂ£ khĂ³a" : "Hoáº¡t Ä‘á»™ng";
    }

    if (loading) {
        return (
            <div>
                <div className="page-title">
                    <h2>Dashboard</h2>
                    <p>Äang táº£i dá»¯ liá»‡u tá»•ng quan...</p>
                </div>

                <div className="panel">
                    <p>Äang táº£i dá»¯ liá»‡u...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-title row-between">
                <div>
                    <h2>Dashboard Admin</h2>
                    <p>Tá»•ng quan há»‡ thá»‘ng TVU Student Project Portal.</p>
                </div>

                <button className="btn-light" onClick={loadDashboard}>
                    LĂ m má»›i
                </button>
            </div>

            {error && <div className="alert error">{error}</div>}

            <div className="dashboard-stat-grid">
                <div className="stat-card blue">
                    <div className="stat-icon">
                        <FaUsers />
                    </div>

                    <div>
                        <span>Tá»•ng ngÆ°á»i dĂ¹ng</span>
                        <strong>{stats.totalUsers}</strong>
                        <p>Táº¥t cáº£ tĂ i khoáº£n trong há»‡ thá»‘ng</p>
                    </div>
                </div>

                <div className="stat-card green">
                    <div className="stat-icon">
                        <FaUserGraduate />
                    </div>

                    <div>
                        <span>Sinh viĂªn</span>
                        <strong>{stats.totalStudents}</strong>
                        <p>TĂ i khoáº£n sinh viĂªn</p>
                    </div>
                </div>

                <div className="stat-card orange">
                    <div className="stat-icon">
                        <FaChalkboardTeacher />
                    </div>

                    <div>
                        <span>Giáº£ng viĂªn</span>
                        <strong>{stats.totalTeachers}</strong>
                        <p>Giáº£ng viĂªn hÆ°á»›ng dáº«n</p>
                    </div>
                </div>

                <div className="stat-card purple">
                    <div className="stat-icon">
                        <FaUserShield />
                    </div>

                    <div>
                        <span>Quáº£n trá»‹ viĂªn</span>
                        <strong>{stats.totalAdmins}</strong>
                        <p>TĂ i khoáº£n quáº£n trá»‹</p>
                    </div>
                </div>

                <div className="stat-card cyan">
                    <div className="stat-icon">
                        <FaSchool />
                    </div>

                    <div>
                        <span>Lá»›p há»c</span>
                        <strong>{stats.totalClasses}</strong>
                        <p>Lá»›p Ä‘ang quáº£n lĂ½</p>
                    </div>
                </div>

                <div className="stat-card red">
                    <div className="stat-icon">
                        <FaLock />
                    </div>

                    <div>
                        <span>TĂ i khoáº£n khĂ³a</span>
                        <strong>{stats.totalInactiveUsers}</strong>
                        <p>Äang bá»‹ vĂ´ hiá»‡u hĂ³a</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="panel">
                    <h3>Tráº¡ng thĂ¡i tĂ i khoáº£n</h3>

                    <div className="mini-stat-list">
                        <div>
                            <span>Äang hoáº¡t Ä‘á»™ng</span>
                            <strong>{stats.totalActiveUsers}</strong>
                        </div>

                        <div>
                            <span>Bá»‹ khĂ³a</span>
                            <strong>{stats.totalInactiveUsers}</strong>
                        </div>

                        <div>
                            <span>Tá»•ng tĂ i khoáº£n</span>
                            <strong>{stats.totalUsers}</strong>
                        </div>
                    </div>
                </div>

                <div className="panel">
                    <h3>Tráº¡ng thĂ¡i lá»›p há»c</h3>

                    <div className="mini-stat-list">
                        <div>
                            <span>Lá»›p hoáº¡t Ä‘á»™ng</span>
                            <strong>{stats.totalActiveClasses}</strong>
                        </div>

                        <div>
                            <span>Lá»›p bá»‹ khĂ³a</span>
                            <strong>{stats.totalInactiveClasses}</strong>
                        </div>

                        <div>
                            <span>Tá»•ng lá»›p</span>
                            <strong>{stats.totalClasses}</strong>
                        </div>
                    </div>
                </div>

                <div className="panel">
                    <h3>Xáº¿p lá»›p sinh viĂªn</h3>

                    <div className="mini-stat-list">
                        <div>
                            <span>ÄĂ£ thuá»™c lá»›p</span>
                            <strong>{stats.assignedStudents}</strong>
                        </div>

                        <div>
                            <span>ChÆ°a thuá»™c lá»›p</span>
                            <strong>{stats.unassignedStudents}</strong>
                        </div>

                        <div>
                            <span>Tá»•ng sinh viĂªn trong lá»›p</span>
                            <strong>{stats.totalStudentsInClasses}</strong>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="panel">
                    <h3>Lá»›p cĂ³ nhiá»u sinh viĂªn nháº¥t</h3>

                    <table>
                        <thead>
                            <tr>
                                <th>MĂ£ lá»›p</th>
                                <th>TĂªn lá»›p</th>
                                <th>Sá»‘ SV</th>
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
                                        ChÆ°a cĂ³ dá»¯ liá»‡u lá»›p há»c.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="panel">
                    <h3>NgÆ°á»i dĂ¹ng má»›i táº¡o</h3>

                    <table>
                        <thead>
                            <tr>
                                <th>Há» tĂªn</th>
                                <th>Vai trĂ²</th>
                                <th>Tráº¡ng thĂ¡i</th>
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
                                        ChÆ°a cĂ³ dá»¯ liá»‡u ngÆ°á»i dĂ¹ng.
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
