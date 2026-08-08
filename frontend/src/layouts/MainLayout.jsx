import { createElement, useState } from 'react'
import { Button, Tooltip } from 'antd'
import { LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { ProLayout } from '@ant-design/pro-components'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { clearAuth, getUser, getUserRole } from '../utils/auth'
import { getNavigation, getRoleLabel } from '../components/layout/navigation'
import TvuBrandMark from '../components/common/TvuBrandMark'
import AppFooter from '../components/layout/AppFooter'

export default function MainLayout() {
  const navigate = useNavigate(), location = useLocation(), user = getUser(), role = getUserRole()
  const [collapsed, setCollapsed] = useState(false)
  const navigation = getNavigation(role)
  const route = { routes: navigation.groups.map((group, groupIndex) => ({
    path: `group-${groupIndex}`, name: group.label,
    routes: group.items.map(item => ({ path: item.path, name: item.label, icon: createElement(item.icon, { size: 18 }) }))
  })) }
  const logout = () => { clearAuth(); navigate('/login') }

  return <ProLayout
    title="TVU Project Portal" logo={<TvuBrandMark compact />}
    layout="mix" route={route} location={{ pathname: location.pathname }}
    fixedHeader fixSiderbar collapsible collapsed={collapsed} onCollapse={setCollapsed}
    siderWidth={268} breakpoint="lg" className="shared-app-layout"
    contentStyle={{ margin: 0, padding: 0, background: '#F4F6FB' }}
    menuItemRender={(item, dom) => <button type="button" className="pro-menu-link" onClick={() => navigate(item.path)}>{dom}</button>}
    avatarProps={{ icon: <UserOutlined />, title: user?.fullName || user?.FullName || getRoleLabel(role), onClick: () => navigate('/profile') }}
    actionsRender={() => [<Tooltip title="Đăng xuất" key="logout"><Button type="text" aria-label="Đăng xuất" icon={<LogoutOutlined />} onClick={logout} /></Tooltip>]}
    menuFooterRender={props => !props?.collapsed && <span style={{ color: '#6B778C', fontSize: 12 }}>{getRoleLabel(role)}</span>}
  >
    <div className="shared-main-area">
      <main className="shared-main-content">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  </ProLayout>
}
