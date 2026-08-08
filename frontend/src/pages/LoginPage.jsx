import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpenCheck, Eye, EyeOff, GraduationCap, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { getCurrentUserApi, loginApi } from '../api/authApi'
import { setAuth, updateStoredUser } from '../utils/auth'
import TvuBrandMark from '../components/common/TvuBrandMark'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const handleChange = event => setForm({ ...form, [event.target.name]: event.target.value })
  const handleSubmit = async event => {
    event.preventDefault(); setError('')
    if (!form.email || !form.password) { setError('Vui lòng nhập email và mật khẩu.'); return }
    try {
      setLoading(true)
      const response = await loginApi(form.email, form.password)
      const authData = response?.data
      setAuth(authData.accessToken, authData.user)
      try { const meResponse = await getCurrentUserApi(); if (meResponse?.data) updateStoredUser(meResponse.data) } catch { /* Giữ dữ liệu đăng nhập hiện có. */ }
      navigate('/dashboard')
    } catch (err) { setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.') } finally { setLoading(false) }
  }
  return <div className="auth-page lms-auth-page">
    <section className="auth-showcase">
      <div className="auth-showcase-brand"><TvuBrandMark size={58} inverse/><div><strong>ĐẠI HỌC TRÀ VINH</strong><span>Tra Vinh University</span></div></div>
      <div className="auth-showcase-copy"><span className="auth-kicker">TVU STUDENT PROJECT PORTAL</span><h1>Không gian học tập và quản lý đồ án tập trung</h1><p>Theo dõi lớp học phần, đề tài, tiến độ và kết quả trong một hệ thống thống nhất.</p><div className="auth-benefits"><span><GraduationCap /> Quản lý học phần</span><span><BookOpenCheck /> Theo dõi đồ án</span><span><ShieldCheck /> Truy cập an toàn</span></div></div>
      <div className="auth-showcase-orbit" aria-hidden="true" />
    </section>
    <section className="auth-login-panel"><div className="auth-card">
      <div className="auth-mobile-brand"><TvuBrandMark size={68}/><strong>ĐẠI HỌC TRÀ VINH</strong></div>
      <div className="auth-heading"><span>CỔNG THÔNG TIN HỌC VỤ</span><h2>Đăng nhập hệ thống</h2></div>
      <p className="auth-desc">Sử dụng tài khoản được cấp để tiếp tục vào không gian làm việc của bạn.</p>
      <div className={`alert error auth-error ${error ? 'visible' : ''}`} role="alert">{error || ' '}</div>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group"><label htmlFor="login-email">Email trường</label><div className="input-with-icon"><Mail size={19} /><input id="login-email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="name@tvu.edu.vn" autoComplete="email" aria-invalid={Boolean(error)} /></div></div>
        <div className="form-group"><label htmlFor="login-password">Mật khẩu</label><div className="input-with-icon"><LockKeyhole size={19} /><input id="login-password" type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="Nhập mật khẩu" autoComplete="current-password" aria-invalid={Boolean(error)} /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></div>
        <button className="btn-primary auth-submit" type="submit" disabled={loading}>{loading && <span className="button-spinner" />}{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
      </form>
      <div className="auth-footer"><strong>TVU Student Project Portal</strong><span>Hỗ trợ quản lý đồ án sinh viên</span></div>
    </div></section>
  </div>
}
