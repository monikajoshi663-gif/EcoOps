import { api } from '../client'

export async function loginUser({ email, password }) {
  const res = await api.post('/api/auth/login', { email, password })
  return res.data
}

export async function registerUser({ name, email, password, role = 'student', team = null }) {
  const res = await api.post('/api/auth/register', { name, email, password, role, team })
  return res.data
}

export async function logoutUser() {
  try {
    await api.post('/api/auth/logout')
  } catch {
    // ignore
  }
}

export async function getCurrentUser() {
  const res = await api.get('/api/auth/me')
  return res.data
}
