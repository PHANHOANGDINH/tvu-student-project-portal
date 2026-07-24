import { Building2, GraduationCap, Mail } from 'lucide-react'

export default function PrivateFooter() {
  return <footer className="private-footer">
    <div className="private-footer-inner">
      <div className="private-footer-block private-footer-left"><Building2/><span><strong>© 2026 Đại học Trà Vinh</strong><small>Bản quyền thuộc Đại học Trà Vinh</small></span></div>
      <div className="private-footer-block private-footer-center"><GraduationCap/><span><strong>Cổng quản lý đồ án sinh viên</strong><small>TVU Student Project Portal</small></span></div>
      <div className="private-footer-block private-footer-right"><Mail/><span><small>Hỗ trợ</small><a href="mailto:info@tvu.edu.vn">info@tvu.edu.vn</a></span></div>
    </div>
  </footer>
}
