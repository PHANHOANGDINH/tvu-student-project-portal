import { request } from './http'

export function loginApi(email, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: email,
      password: password
    })
  })
}

export function registerApi(payload) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}