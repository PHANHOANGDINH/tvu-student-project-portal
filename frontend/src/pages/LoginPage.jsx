import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUserApi, loginApi } from '../api/authApi'
import { setAuth, updateStoredUser } from '../utils/auth'

function LoginPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '',
    password: ''
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.email || !form.password) {
      setError('Vui lòng nhập email và mật khẩu')
      return
    }

    try {
      setLoading(true)

      const response = await loginApi(form.email, form.password)
      const authData = response?.data

      setAuth(authData.accessToken, authData.user)

      try {
        const meResponse = await getCurrentUserApi()
        if (meResponse?.data) updateStoredUser(meResponse.data)
      } catch {
        // Login already returned the required auth user; /me will be retried in protected pages.
      }

      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Đăng nhập</h1>

        <p className="auth-desc">
          Đăng nhập vào cổng quản lý dự án sinh viên TVU.
        </p>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Nhập email"
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
            />
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
