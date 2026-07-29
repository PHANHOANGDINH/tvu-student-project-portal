import { useNavigate } from "react-router-dom";
import { clearAuth, getUser } from "../utils/auth";
import "./HomePage.css";

function HomePage() {
    const navigate = useNavigate();
    const user = getUser();

    function handleLogout() {
        clearAuth();
        navigate("/login");
    }

    return (
        <div className="home-page">
            <header className="topbar">
                <div>
                    <h2>🎓 TVU Student Project Portal</h2>
                    <span>Hệ thống quản lý đồ án sinh viên</span>
                </div>

                <button className="logout-btn" onClick={handleLogout}>
                    Đăng xuất
                </button>
            </header>

            <main className="home-container">
                <div className="welcome-card">
                    <h1>Xin chào 👋</h1>

                    <p>Chào mừng bạn đã đăng nhập thành công vào hệ thống.</p>

                    {user && (
                        <div className="info-grid">
                            <div className="info-item">
                                <span>👤 Họ tên</span>
                                <strong>
                                    {user.fullName || user.name || "Chưa có"}
                                </strong>
                            </div>

                            <div className="info-item">
                                <span>📧 Email</span>
                                <strong>{user.email || "Chưa có"}</strong>
                            </div>

                            <div className="info-item">
                                <span>🎯 Vai trò</span>
                                <strong>{user.role || "User"}</strong>
                            </div>

                            <div className="info-item">
                                <span>🆔 ID</span>
                                <strong>{user.id}</strong>
                            </div>
                        </div>
                    )}
                </div>

                <div className="feature-card">
                    <h3>🚀 Chức năng sắp triển khai</h3>

                    <ul>
                        <li>📋 Danh sách đề tài</li>
                        <li>👨‍🎓 Đăng ký nhóm</li>
                        <li>📁 Nộp báo cáo</li>
                        <li>📊 Theo dõi tiến độ</li>
                        <li>💬 Trao đổi với giảng viên</li>
                    </ul>
                </div>
            </main>
        </div>
    );
}

export default HomePage;
