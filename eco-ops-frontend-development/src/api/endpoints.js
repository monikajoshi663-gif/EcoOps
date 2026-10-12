// Single source of truth for backend routes. Keep in sync with API_CONTRACT.md.
export const ENDPOINTS = {
  complaints: '/api/complaints',
  usage: '/api/usage',
  anomalies: '/api/anomalies',
  agentRun: '/api/agent/run',
  agentLogs: '/api/agent/logs',
  agentChat: '/api/agent/chat',
  tickets: '/api/tickets',
  ticket: (id) => `/api/tickets/${encodeURIComponent(id)}`,
  approvals: '/api/approvals',
  approvalDecision: (id) => `/api/approvals/${encodeURIComponent(id)}/decision`,
  notifications: '/api/notifications',
  notification: (id) => `/api/notifications/${encodeURIComponent(id)}`,
  notificationRead: (id) => `/api/notifications/${encodeURIComponent(id)}/read`,
  impact: '/api/impact',
}
