import { request } from './http'

export function loginApi(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password
    })
  })
}

export function getCurrentUserApi() {
  return request('/auth/me')
}

export function changePasswordApi(payload) {
  return request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export function registerApi() {
  return request('/auth/register', {
    method: 'POST'
  })
}
