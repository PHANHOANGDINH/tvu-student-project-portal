import { Mail, MapPin, Phone } from 'lucide-react'

export default function AppFooter() {
  return <footer className="app-footer"><div className="footer-inner"><div className="footer-brand"><span className="footer-logo">TVU</span><div><strong>TRƯỜNG ĐẠI HỌC TRÀ VINH</strong><p>TVU Student Project Portal</p></div></div><div className="footer-contact"><span><MapPin size={15} /> 126 Nguyễn Thiện Thành, Phường Hòa Thuận, Vĩnh Long</span><span><Phone size={15} /> (0294) 3855 246</span><span><Mail size={15} /> tvu@tvu.edu.vn</span></div></div><div className="footer-bottom">© Trường Đại học Trà Vinh · Hệ thống hỗ trợ quản lý đồ án sinh viên</div></footer>
}
