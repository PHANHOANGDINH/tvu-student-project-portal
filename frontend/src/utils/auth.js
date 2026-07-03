const TOKEN_KEY = 'access_token'
const USER_KEY = 'current_user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY)

  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function getUserRole() {
  const user = getUser()
  return user?.role || 'Student'
}

export function isLoggedIn() {
  return !!getToken()
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}