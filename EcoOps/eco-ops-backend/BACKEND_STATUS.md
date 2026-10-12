# BACKEND_STATUS.md — EcoOps

**Last Updated:** 2026-10-12  
**Status:** ✅ RUNNING on http://localhost:5000

## Run Commands
```bash
cd eco-ops-backend
node src/server.js
```

## ✅ Working Endpoints

| Method | Endpoint | Status |
|--------|----------|--------|
| GET | /api/health | ✅ |
| GET | /api/demo/users | ✅ |
| POST | /api/auth/register | ✅ |
| POST | /api/auth/login | ✅ |
| GET | /api/auth/me | ✅ |
| GET | /api/buildings | ✅ |
| GET | /api/usage | ✅ |
| POST | /api/usage/generate | ✅ |
| GET | /api/anomalies | ✅ |
| POST | /api/complaints | ✅ (triggers agent) |
| GET | /api/complaints | ✅ |
| GET | /api/tickets | ✅ |
| POST | /api/tickets | ✅ |
| PATCH | /api/tickets/:id | ✅ |
| GET | /api/approvals | ✅ (admin only) |
| POST | /api/approvals/:id/decision | ✅ (admin only) |
| GET | /api/notifications | ✅ |
| PATCH | /api/notifications/:id | ✅ |
| GET | /api/impact | ✅ |
| POST | /api/agent/run | ✅ (admin only) |
| GET | /api/agent/runs/:id | ✅ |
| GET | /api/agent/logs | ✅ |
| POST | /api/agent/chat | ✅ (Gemini if key set) |

## Seed Data
- 5 buildings, 3 demo users, 6 anomalies, 3360 hourly readings (14 days)

## Demo User Headers
- `X-Demo-User-Id: demo-student`
- `X-Demo-User-Id: demo-staff`
- `X-Demo-User-Id: demo-admin`
