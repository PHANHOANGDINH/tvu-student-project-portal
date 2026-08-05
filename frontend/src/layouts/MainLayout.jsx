import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { clearAuth, getUser, getUserRole } from '../utils/auth'
import { getNavigation, getRoleLabel } from '../components/layout/navigation'
import AppSidebar from '../components/layout/AppSidebar'
import AppHeader from '../components/layout/AppHeader'
import AppFooter from '../components/layout/AppFooter'

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getUser()
  const role = getUserRole()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigation = getNavigation(role)

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {mobileOpen && <button className="sidebar-overlay" aria-label="Đóng menu" onClick={() => setMobileOpen(false)} />}
      <AppSidebar
        groups={navigation.groups}
        roleLabel={getRoleLabel(role)}
        homePath={navigation.homePath}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
        onClose={() => setMobileOpen(false)}
        onToggle={() => setCollapsed(value => !value)}
      />
      <div className="main-area">
        <AppHeader
          pathname={location.pathname}
          items={navigation.groups.flatMap(group => group.items)}
          user={user}
          role={role}
          roleLabel={getRoleLabel(role)}
          onMenu={() => setMobileOpen(true)}
          onProfile={() => navigate('/profile')}
          onLogout={handleLogout}
        />
        <main className="content"><Outlet /></main>
        <AppFooter />
      </div>
    </div>
  )
}
