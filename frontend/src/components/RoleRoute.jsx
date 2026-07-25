import { Navigate } from 'react-router-dom'
import { getUserRole, isLoggedIn } from '../utils/auth'
import { USER_ROLES } from '../constants/roles'

function getHomePathByRole(role) {
  if (role === USER_ROLES.ADMIN) return '/dashboard'
  if (role === USER_ROLES.LECTURER) return '/teacher/dashboard'
  if (role === USER_ROLES.STUDENT) return '/student/dashboard'

  return '/login'
}

function RoleRoute({ allowedRoles, children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />
  }

  const role = getUserRole()

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getHomePathByRole(role)} replace />
  }

  return children
}

export default RoleRoute
