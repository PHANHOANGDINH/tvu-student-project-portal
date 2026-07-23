import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'

export default function PublicFooter() {
  return <footer className="public-footer" id="lien-he">
    <div className="public-footer-grid">
      <div className="public-footer-about"><span className="public-brand-mark">TVU</span><h2>Đại học Trà Vinh</h2><p>Cổng quản lý đồ án sinh viên, kết nối hoạt động học tập và hướng dẫn trong một không gian thống nhất.</p></div>
      <div><h3>Thông tin liên hệ</h3><p><MapPin /> 126 Nguyễn Thiện Thành, Phường Hòa Thuận, Tỉnh Vĩnh Long</p><p><Phone /> (0294) 3855 246</p><p><Mail /> info@tvu.edu.vn</p></div>
      <div><h3>Liên kết nhanh</h3><Link to="/">Trang chủ</Link><Link to="/login">Đăng nhập</Link><a href="/#huong-dan">Hướng dẫn</a><a href="/#lien-he">Liên hệ</a></div>
      <div><h3>Hỗ trợ</h3><p>Vui lòng liên hệ đơn vị quản trị khi cần hỗ trợ tài khoản hoặc truy cập lớp học phần.</p><span className="public-support-time">Thứ Hai – Thứ Sáu · 07:00 – 17:00</span></div>
    </div><div className="public-footer-bottom"><span>© 2026 Đại học Trà Vinh. Bảo lưu mọi quyền.</span><span>TVU Student Project Portal</span></div>
  </footer>
}
