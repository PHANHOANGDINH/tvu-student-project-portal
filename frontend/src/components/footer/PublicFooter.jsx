import { CircleHelp, Globe, Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getUser, isLoggedIn } from '../../utils/auth'

const contacts = [
  { Icon: MapPin, label: <>126 Nguyễn Thiện Thành, Phường Hòa Thuận,<br/>Tỉnh Vĩnh Long</> },
  { Icon: Phone, label: <a href="tel:02943855246">0294.3855246</a> },
  { Icon: Mail, label: <a href="mailto:info@tvu.edu.vn">info@tvu.edu.vn</a> },
  { Icon: Globe, label: <a href="https://www.tvu.edu.vn" target="_blank" rel="noreferrer noopener">www.tvu.edu.vn</a> },
]

export default function PublicFooter() {
  const user = getUser()
  const authenticated = isLoggedIn()
  const displayName = user?.fullName || user?.FullName || user?.email || user?.Email

  return <footer className="public-footer" id="lien-he">
    <div className="public-footer-shapes" aria-hidden="true"/>
    <div className="public-footer-container">
      <section className="public-footer-school" aria-labelledby="public-footer-title">
        <h2 id="public-footer-title">ĐẠI HỌC TRÀ VINH</h2>
        <div className="public-contact-list">{contacts.map(({Icon,label},index)=><div className="public-contact-item" key={index}><span className="public-contact-icon"><Icon/></span><div>{label}</div></div>)}</div>
      </section>
      <section className="public-footer-access">
        {authenticated?<><p>Bạn đang đăng nhập với tài khoản:<strong>{displayName||'Người dùng'}</strong></p><Link className="public-footer-login" to="/dashboard">Truy cập bảng điều khiển</Link></>:<><p>Bạn đang truy cập với tư cách khách vãng lai</p><Link className="public-footer-login" to="/login">(Đăng nhập)</Link></>}
        <a className="public-footer-policy" href="/#huong-dan">Chính sách lưu trữ và bảo vệ dữ liệu</a>
      </section>
      <div className="public-footer-decoration" aria-hidden="true"/>
    </div>
    <a className="public-help-button" href="/#huong-dan" aria-label="Trợ giúp" title="Trợ giúp"><CircleHelp/></a>
  </footer>
}
