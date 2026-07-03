import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginApi } from '../api/authApi'

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

      const data = await loginApi(form.email, form.password)

      localStorage.setItem('access_token', data.token)
      localStorage.setItem('current_user', JSON.stringify(data.user))

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

        <p className="auth-switch">
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage