import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const navItems = [['Trang chủ', '/#trang-chu'], ['Giới thiệu', '/#gioi-thieu'], ['Hướng dẫn', '/#huong-dan'], ['Liên hệ', '/#lien-he']]

export default function PublicHeader({ compact = false }) {
  const [open, setOpen] = useState(false)
  return (
    <header className="public-header"><div className="public-header-inner">
      <Link className="public-brand" to="/"><span className="public-brand-mark">TVU</span><span><strong>TVU Student Project Portal</strong><small>Cổng quản lý đồ án sinh viên</small></span></Link>
      {!compact && <><button className="public-menu-toggle" type="button" aria-label={open ? 'Đóng trình đơn' : 'Mở trình đơn'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button><nav className={`public-nav ${open ? 'open' : ''}`}>{navItems.map(([label, href]) => <a key={label} href={href} onClick={() => setOpen(false)}>{label}</a>)}<Link className="public-nav-login" to="/login">Đăng nhập</Link></nav></>}
      {compact && <Link className="public-home-link" to="/">Về trang chủ</Link>}
    </div></header>
  )
}
