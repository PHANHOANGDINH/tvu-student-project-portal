<<<<<<< HEAD
import { useEffect, useMemo, useState } from "react";
=======
﻿import { useEffect, useMemo, useState } from "react";
import { getClassesApi, getDashboardApi, getUsersApi } from '../api/adminApi'
import { normalizeRole, USER_ROLES } from '../constants/roles'
>>>>>>> be6dd66 (feat: bổ sung module quản trị, sinh viên và giảng viên)
import {
    FaUsers,
    FaUserGraduate,
    FaChalkboardTeacher,
    FaUserShield,
    FaSchool,
    FaLock,
<<<<<<< HEAD
    FaSyncAlt,
} from "react-icons/fa";

import { getDashboardApi, getUsersApi, getClassesApi } from "../api/adminApi";

import { normalizeRole, USER_ROLES } from "../constants/roles";

import "../dashboard.css";

export default function DashboardPage() {
    const [dashboard, setDashboard] = useState({});
=======
} from "react-icons/fa";

import "../dashboard.css";
function DashboardPage() {
    const [dashboard, setDashboard] = useState(null);
>>>>>>> be6dd66 (feat: bổ sung module quản trị, sinh viên và giảng viên)
    const [users, setUsers] = useState([]);
    const [classes, setClasses] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadDashboard();
    }, []);

<<<<<<< HEAD
    const loadDashboard = async () => {
=======
    async function loadDashboard() {
>>>>>>> be6dd66 (feat: bổ sung module quản trị, sinh viên và giảng viên)
        try {
            setLoading(true);
            setError("");

<<<<<<< HEAD
            const [dashboardRes, usersRes, classesRes] = await Promise.all([
                getDashboardApi().catch(() => null),
                getUsersApi(),
                getClassesApi(),
            ]);

            setDashboard(dashboardRes?.data || {});
            setUsers(Array.isArray(usersRes?.data) ? usersRes.data : []);

            setClasses(Array.isArray(classesRes?.data) ? classesRes.data : []);
        } catch (err) {
            console.error(err);

            setError(err?.message || "Không thể tải dữ liệu.");

            setDashboard({});
            setUsers([]);
            setClasses([]);
        } finally {
            setLoading(false);
        }
    };
    const stats = useMemo(() => {
        const totalUsers = dashboard?.totalUsers ?? users.length;

        const totalStudents = users.filter(
            (user) => normalizeRole(user.Role) === USER_ROLES.STUDENT,
        ).length;

        const totalTeachers = users.filter(
            (user) => normalizeRole(user.Role) === USER_ROLES.LECTURER,
        ).length;

        const totalAdmins = users.filter(
            (user) => normalizeRole(user.Role) === USER_ROLES.ADMIN,
        ).length;

        const totalClasses = classes.length;

        const totalActiveUsers = users.filter(
            (user) => user.IsActive !== false,
        ).length;

        const totalInactiveUsers = users.filter(
            (user) => user.IsActive === false,
        ).length;

        const totalActiveClasses = classes.filter(
            (item) => item.IsActive !== false,
        ).length;

        const totalInactiveClasses = classes.filter(
            (item) => item.IsActive === false,
        ).length;

        const assignedStudents = users.filter((user) => {
            if (normalizeRole(user.Role) !== USER_ROLES.STUDENT) {
                return false;
            }

            return Boolean(
                user.ActiveClassId ||
                user.ActiveClassCode ||
                user.ActiveClassName,
            );
        }).length;

        const unassignedStudents = totalStudents - assignedStudents;

        const totalStudentsInClasses = classes.reduce(
            (sum, item) => sum + Number(item.TotalStudents || 0),
            0,
        );
=======
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
>>>>>>> be6dd66 (feat: bổ sung module quản trị, sinh viên và giảng viên)

        return {
            totalUsers,
            totalStudents,
            totalTeachers,
            totalAdmins,
<<<<<<< HEAD

            totalClasses,

            totalActiveUsers,
            totalInactiveUsers,

            totalActiveClasses,
            totalInactiveClasses,

            assignedStudents,
            unassignedStudents,

=======
            totalActiveUsers,
            totalInactiveUsers,
            totalClasses,
            totalActiveClasses,
            totalInactiveClasses,
            assignedStudents,
            unassignedStudents,
>>>>>>> be6dd66 (feat: bổ sung module quản trị, sinh viên và giảng viên)
            totalStudentsInClasses,
        };
    }, [dashboard, users, classes]);

<<<<<<< HEAD
    if (loading) {
        return (
            <div className="loading-page">
                <div className="loading-card">
                    <h2>Đang tải Dashboard...</h2>
                    <p>Vui lòng chờ trong giây lát...</p>
=======
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
>>>>>>> be6dd66 (feat: bổ sung module quản trị, sinh viên và giảng viên)
                </div>
            </div>
        );
    }

    return (
<<<<<<< HEAD
        <div className="dashboard-container">
            {/* ================= HEADER ================= */}

            <div className="dashboard-header">
                <div>
                    <h1>Dashboard Admin 👋</h1>

                    <p>Chào mừng trở lại hệ thống quản lý đồ án.</p>
                </div>

                <button className="refresh-btn" onClick={loadDashboard}>
                    <FaSyncAlt />
                    <span>Làm mới</span>
=======
        <div>
            <div className="page-title row-between">
                <div>
                    <h2>Dashboard Admin</h2>
                    <p>Tá»•ng quan há»‡ thá»‘ng TVU Student Project Portal.</p>
                </div>

                <button className="btn-light" onClick={loadDashboard}>
                    LĂ m má»›i
>>>>>>> be6dd66 (feat: bổ sung module quản trị, sinh viên và giảng viên)
                </button>
            </div>

            {error && <div className="alert error">{error}</div>}

<<<<<<< HEAD
            {/* ================= STAT CARDS ================= */}

=======
>>>>>>> be6dd66 (feat: bổ sung module quản trị, sinh viên và giảng viên)
            <div className="dashboard-stat-grid">
                <div className="stat-card blue">
                    <div className="stat-icon">
                        <FaUsers />
                    </div>

<<<<<<< HEAD
                    <div className="stat-content">
                        <span>Tổng người dùng</span>
                        <h2>{stats.totalUsers}</h2>
                        <small>Tổng số tài khoản trong hệ thống</small>
=======
                    <div>
                        <span>Tá»•ng ngÆ°á»i dĂ¹ng</span>
                        <strong>{stats.totalUsers}</strong>
                        <p>Táº¥t cáº£ tĂ i khoáº£n trong há»‡ thá»‘ng</p>
>>>>>>> be6dd66 (feat: bổ sung module quản trị, sinh viên và giảng viên)
                    </div>
                </div>

                <div className="stat-card green">
                    <div className="stat-icon">
                        <FaUserGraduate />
                    </div>

<<<<<<< HEAD
                    <div className="stat-content">
                        <span>Sinh viên</span>
                        <h2>{stats.totalStudents}</h2>
                        <small>Đang học trong hệ thống</small>
=======
                    <div>
                        <span>Sinh viĂªn</span>
                        <strong>{stats.totalStudents}</strong>
                        <p>TĂ i khoáº£n sinh viĂªn</p>
>>>>>>> be6dd66 (feat: bổ sung module quản trị, sinh viên và giảng viên)
                    </div>
                </div>

                <div className="stat-card orange">
                    <div className="stat-icon">
                        <FaChalkboardTeacher />
                    </div>

<<<<<<< HEAD
                    <div className="stat-content">
                        <span>Giảng viên</span>
                        <h2>{stats.totalTeachers}</h2>
                        <small>Hướng dẫn đồ án</small>
=======
                    <div>
                        <span>Giáº£ng viĂªn</span>
                        <strong>{stats.totalTeachers}</strong>
                        <p>Giáº£ng viĂªn hÆ°á»›ng dáº«n</p>
>>>>>>> be6dd66 (feat: bổ sung module quản trị, sinh viên và giảng viên)
                    </div>
                </div>

                <div className="stat-card purple">
                    <div className="stat-icon">
                        <FaUserShield />
                    </div>

<<<<<<< HEAD
                    <div className="stat-content">
                        <span>Quản trị viên</span>
                        <h2>{stats.totalAdmins}</h2>
                        <small>Administrator</small>
=======
                    <div>
                        <span>Quáº£n trá»‹ viĂªn</span>
                        <strong>{stats.totalAdmins}</strong>
                        <p>TĂ i khoáº£n quáº£n trá»‹</p>
>>>>>>> be6dd66 (feat: bổ sung module quản trị, sinh viên và giảng viên)
                    </div>
                </div>

                <div className="stat-card cyan">
                    <div className="stat-icon">
                        <FaSchool />
                    </div>

<<<<<<< HEAD
                    <div className="stat-content">
                        <span>Lớp học</span>
                        <h2>{stats.totalClasses}</h2>
                        <small>Đang quản lý</small>
=======
                    <div>
                        <span>Lá»›p há»c</span>
                        <strong>{stats.totalClasses}</strong>
                        <p>Lá»›p Ä‘ang quáº£n lĂ½</p>
>>>>>>> be6dd66 (feat: bổ sung module quản trị, sinh viên và giảng viên)
                    </div>
                </div>

                <div className="stat-card red">
                    <div className="stat-icon">
                        <FaLock />
                    </div>

<<<<<<< HEAD
                    <div className="stat-content">
                        <span>Tài khoản bị khóa</span>
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
                                        : `${(stats.totalActiveClasses / stats.totalClasses) * 100}%`,
                            }}
                        />
                    </div>

                    <div className="mini-item">
                        <span>Lớp bị khóa</span>
                        <strong>{stats.totalInactiveClasses}</strong>
                    </div>

                    <div className="progress">
                        <div
                            className="progress-orange"
                            style={{
                                width:
                                    stats.totalClasses === 0
                                        ? "0%"
                                        : `${(stats.totalInactiveClasses / stats.totalClasses) * 100}%`,
                            }}
                        />
=======
                    <div>
                        <span>TĂ i khoáº£n khĂ³a</span>
                        <strong>{stats.totalInactiveUsers}</strong>
                        <p>Äang bá»‹ vĂ´ hiá»‡u hĂ³a</p>
>>>>>>> be6dd66 (feat: bổ sung module quản trị, sinh viên và giảng viên)
                    </div>
                </div>
            </div>

<<<<<<< HEAD
            {/* ================= SINH VIÊN ================= */}

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
=======
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
>>>>>>> be6dd66 (feat: bổ sung module quản trị, sinh viên và giảng viên)
                    </div>
                </div>
            </div>

<<<<<<< HEAD
            {/* ================= TABLE ================= */}

            <div className="table-grid">
                {/* Top Classes */}

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
                    </table>
                </div>
                {/* ================= RECENT USERS ================= */}

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
=======
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
>>>>>>> be6dd66 (feat: bổ sung module quản trị, sinh viên và giảng viên)
                    </table>
                </div>
            </div>
        </div>
    );
}
<<<<<<< HEAD
=======

export default DashboardPage;
>>>>>>> be6dd66 (feat: bổ sung module quản trị, sinh viên và giảng viên)
