export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

export const HAS_BACKEND = API_BASE_URL.length > 0

export const DEMO_USERS = {
  student: { id: import.meta.env.VITE_DEMO_STUDENT_ID || 'demo-student', name: 'Aisha (Student)', role: 'student' },
  staff: { id: import.meta.env.VITE_DEMO_STAFF_ID || 'demo-staff', name: 'Ravi (Facility Staff)', role: 'staff' },
  admin: { id: import.meta.env.VITE_DEMO_ADMIN_ID || 'demo-admin', name: 'Dr. Mehta (Sustainability Head)', role: 'admin' },
}

export const POLL = {
  logs: 3000,
  live: 5000,
  usage: 30000,
}
