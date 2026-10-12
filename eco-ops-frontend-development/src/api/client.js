import { API_BASE_URL, HAS_BACKEND } from '../config'

export class ApiError extends Error {
  constructor(message, { status = 0, body = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

function buildUrl(path, query) {
  const url = new URL(`${API_BASE_URL}${path}`)
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
    })
  }
  return url.toString()
}

let activeDemoUserId = typeof window !== 'undefined' ? (window.localStorage?.getItem('ecoops_demo_user_id') || 'demo-admin') : 'demo-admin'

export function setDemoUser(userId) {
  activeDemoUserId = userId
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('ecoops_demo_user_id', userId)
  }
}

export function getDemoUser() {
  return activeDemoUserId
}

export async function request(path, { method = 'GET', query, body, signal } = {}) {
  if (!HAS_BACKEND) {
    throw new ApiError('No backend configured. Set VITE_API_BASE_URL in .env.')
  }

  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  const token = typeof window !== 'undefined' ? window.localStorage?.getItem('ecoops_token') : null
  const headers = { 
    Accept: 'application/json',
    'X-Demo-User-Id': activeDemoUserId || 'demo-admin'
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'

  let response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError(`Cannot reach backend at ${API_BASE_URL}. Is the server running?`)
  }

  const text = await response.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && (data.message || data.error)) ||
      `Request failed: ${method} ${path} (${response.status})`
    throw new ApiError(message, { status: response.status, body: data })
  }

  return data
}

export const api = {
  get: (path, query) => request(path, { query }),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
}
