import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { getCurrentUserApi, loginApi } from '../api/authApi'
import { setAuth, updateStoredUser } from '../utils/auth'

function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }) }
  async function handleSubmit(e) {
    e.preventDefault(); setError('')
    if (!form.email || !form.password) { setError('Vui lòng nhập email và mật khẩu'); return }
    try {
      setLoading(true)
      const response = await loginApi(form.email, form.password)
      const authData = response?.data
      setAuth(authData.accessToken, authData.user)
      try { const meResponse = await getCurrentUserApi(); if (meResponse?.data) updateStoredUser(meResponse.data) } catch { /* giữ dữ liệu đăng nhập hiện có */ }
      navigate('/dashboard')
    } catch (err) { setError(err.message || 'Đăng nhập thất bại') } finally { setLoading(false) }
  }
  return <div className="auth-page"><div className="auth-card">
    <div className="auth-logo">TVU</div>
    <div className="auth-heading"><span>TRƯỜNG ĐẠI HỌC TRÀ VINH</span><h1>Cổng quản lý đồ án sinh viên</h1></div>
    <p className="auth-desc">Đăng nhập để quản lý, theo dõi và hoàn thành đồ án của bạn.</p>
    <div className={`alert error auth-error ${error ? 'visible' : ''}`} role="alert">{error || ' '}</div>
    <form onSubmit={handleSubmit}>
      <div className="form-group"><label htmlFor="login-email">Email</label><div className="input-with-icon"><Mail size={19} /><input id="login-email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="name@tvu.edu.vn" autoComplete="email" /></div></div>
      <div className="form-group"><label htmlFor="login-password">Mật khẩu</label><div className="input-with-icon"><LockKeyhole size={19} /><input id="login-password" type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="Nhập mật khẩu" autoComplete="current-password" /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></div>
      <button className="btn-primary" type="submit" disabled={loading}>{loading && <span className="button-spinner" />}{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
    </form>
    <div className="auth-footer"><strong>TVU Student Project Portal</strong><span>Hệ thống hỗ trợ quản lý đồ án sinh viên</span></div>
  </div></div>
}
export default LoginPage
