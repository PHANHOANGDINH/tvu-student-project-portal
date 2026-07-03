import { Navigate } from 'react-router-dom'
import { getUserRole, isLoggedIn } from '../utils/auth'

function getHomePathByRole(role) {
  if (role === 'Admin') return '/dashboard'
  if (role === 'Teacher') return '/teacher/dashboard'
  if (role === 'Student') return '/student/dashboard'

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