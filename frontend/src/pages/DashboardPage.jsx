import { useEffect, useMemo, useState } from "react";
import {
    FaUsers,
    FaUserGraduate,
    FaChalkboardTeacher,
    FaUserShield,
    FaSchool,
    FaLock,
    FaSyncAlt,
} from "react-icons/fa";

import { getDashboardApi, getUsersApi, getClassesApi } from "../api/adminApi";

import { normalizeRole, USER_ROLES } from "../constants/roles";

import "../dashboard.css";

export default function DashboardPage() {
    const [dashboard, setDashboard] = useState({});
    const [users, setUsers] = useState([]);
    const [classes, setClasses] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError("");

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

    if (loading) {
        return (
            <div className="loading-page">
                <div className="loading-card">
                    <h2>Đang tải Dashboard...</h2>
                    <p>Vui lòng chờ trong giây lát...</p>
                </div>
            </div>
        );
    }

    return (
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
                </button>
            </div>

            {error && <div className="alert error">{error}</div>}

            {/* ================= STAT CARDS ================= */}

            <div className="dashboard-stat-grid">
                <div className="stat-card blue">
                    <div className="stat-icon">
                        <FaUsers />
                    </div>

                    <div className="stat-content">
                        <span>Tổng người dùng</span>
                        <h2>{stats.totalUsers}</h2>
                        <small>Tổng số tài khoản trong hệ thống</small>
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
                    </div>
                </div>
            </div>

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
                    </div>
                </div>
            </div>

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
                    </table>
                </div>
            </div>
        </div>
    );
}
