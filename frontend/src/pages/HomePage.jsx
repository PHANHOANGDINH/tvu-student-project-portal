import { useNavigate } from 'react-router-dom'
import { clearAuth, getUser } from '../utils/auth'

function HomePage() {
  const navigate = useNavigate()
  const user = getUser()

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="home-page">
      <div className="topbar">
        <h2>TVU Student Project Portal</h2>
        <button onClick={handleLogout}>Đăng xuất</button>
      </div>

      <main className="home-content">
        <h1>Trang chủ</h1>
        <p>Đăng nhập thành công. Bước tiếp theo sẽ là hiển thị danh sách câu hỏi.</p>

        {user && (
          <div className="user-box">
            <h3>Thông tin người dùng</h3>
            <pre>{JSON.stringify(user, null, 2)}</pre>
          </div>
        )}
      </main>
    </div>
  )
}

export default HomePage