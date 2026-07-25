import { normalizeRole, USER_ROLES } from '../constants/roles'

const TOKEN_KEY = 'access_token'
const USER_KEY = 'current_user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY)

  if (!raw) return null

  try {
    const user = JSON.parse(raw)
    const role = normalizeRole(user?.role || user?.Role)

    return {
      ...user,
      role
    }
  } catch {
    return null
  }
}

export function setAuth(accessToken, user) {
  localStorage.setItem(TOKEN_KEY, accessToken)
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      ...user,
      role: normalizeRole(user?.role || user?.Role)
    })
  )
}

export function updateStoredUser(user) {
  const currentUser = getUser() || {}
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      ...currentUser,
      ...user,
      role: normalizeRole(user?.role || user?.Role || currentUser.role)
    })
  )
}

export function getUserRole() {
  const user = getUser()
  return normalizeRole(user?.role || user?.Role) || USER_ROLES.STUDENT
}

export function isLoggedIn() {
  return !!getToken()
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
