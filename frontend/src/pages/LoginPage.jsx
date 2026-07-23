import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpenCheck, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { getCurrentUserApi, loginApi } from '../api/authApi'
import { setAuth, updateStoredUser } from '../utils/auth'
import AuthLayout from '../layouts/AuthLayout'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  function handleChange(event) { setForm({ ...form, [event.target.name]: event.target.value }) }
  async function handleSubmit(event) {
    event.preventDefault(); setError('')
    if (!form.email || !form.password) { setError('Vui lòng nhập email hoặc tên đăng nhập và mật khẩu.'); return }
    try {
      setLoading(true)
      const response = await loginApi(form.email, form.password)
      const authData = response?.data
      setAuth(authData.accessToken, authData.user)
      try { const meResponse = await getCurrentUserApi(); if (meResponse?.data) updateStoredUser(meResponse.data) } catch { /* Thông tin đăng nhập hiện tại vẫn hợp lệ. */ }
      navigate('/dashboard')
    } catch { setError('Thông tin đăng nhập chưa chính xác. Vui lòng kiểm tra và thử lại.') }
    finally { setLoading(false) }
  }
  return <AuthLayout><main className="login-main">
    <section className="login-intro"><span className="public-eyebrow"><BookOpenCheck /> Cổng học tập trực tuyến</span><h1>Chào mừng bạn trở lại với <em>TVU Student Project Portal</em></h1><p>Đăng nhập để tiếp tục quản lý lớp học, đề tài, bài nộp và kết quả đồ án trong một không gian học tập thống nhất.</p><div className="login-benefit"><ShieldCheck/><span><strong>Truy cập theo vai trò</strong>Không gian riêng dành cho quản trị viên, giảng viên và sinh viên.</span></div></section>
    <section className="login-panel"><div className="login-card"><span className="login-kicker">TRUY CẬP HỆ THỐNG</span><h2>Đăng nhập</h2><p>Nhập thông tin tài khoản do nhà trường cung cấp.</p>{error && <div className="login-error" role="alert">{error}</div>}<form onSubmit={handleSubmit}>
      <label htmlFor="email">Email / Tên đăng nhập</label><div className="login-field"><Mail/><input id="email" type="text" name="email" value={form.email} onChange={handleChange} placeholder="Nhập email hoặc tên đăng nhập" autoComplete="username" /></div>
      <label htmlFor="password">Mật khẩu</label><div className="login-field"><LockKeyhole/><input id="password" type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="Nhập mật khẩu" autoComplete="current-password"/><button type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff/> : <Eye/>}</button></div>
      <button className="login-submit" type="submit" disabled={loading}>{loading ? <><span className="login-spinner"/> Đang đăng nhập...</> : 'Đăng nhập'}</button>
    </form><Link className="login-back" to="/"><ArrowLeft/> Quay về trang chủ</Link></div><p className="login-help">Bạn gặp khó khăn khi đăng nhập? Liên hệ đơn vị quản trị để được hỗ trợ.</p></section>
  </main></AuthLayout>
}
