import { NavLink } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'

export default function AppSidebar({ groups, roleLabel, homePath, collapsed, mobileOpen, onNavigate, onClose, onToggle }) {
  return (
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`} aria-label="Thanh điều hướng">
      <div className="brand">
        <NavLink className="brand-home" to={homePath} onClick={onNavigate} aria-label="Về trang tổng quan">
          <div className="brand-logo">TVU</div>
          <div className="brand-text"><h2>Project Portal</h2><p>Cổng quản lý đồ án sinh viên</p></div>
        </NavLink>
        <button className="mobile-close" aria-label="Đóng menu" onClick={onClose}><X size={20} /></button>
      </div>
      <nav className="menu" aria-label="Điều hướng chính">
        {groups.map(group => (
          <section className="menu-section" key={group.label}>
            <p className="menu-label">{group.label}</p>
            {group.items.map(item => {
              const Icon = item.icon
              return <NavLink key={item.path} to={item.path} onClick={onNavigate} title={collapsed ? item.label : undefined} className={({ isActive }) => isActive ? 'menu-link active' : 'menu-link'}><Icon size={19} /><span>{item.label}</span></NavLink>
            })}
          </section>
        ))}
      </nav>
      <div className="sidebar-role"><span>Vai trò hiện tại</span><strong>{roleLabel}</strong></div>
      <button className="collapse-btn" onClick={onToggle} aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}>
        {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}<span>Thu gọn menu</span>
      </button>
    </aside>
  )
}
