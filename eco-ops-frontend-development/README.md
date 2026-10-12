# EcoOps Frontend

React + Vite frontend for **EcoOps**, an AI-assisted campus sustainability operations platform (Kaushal 8.0, PS-04). It shows electricity and water usage, lets students report issues, gives facility staff a ticket board, lets the sustainability head approve agent actions, and streams the autonomous agent's reasoning log.

This repo holds the frontend only. It talks to the EcoOps Express backend over REST.

## Quick start

```bash
npm install
cp .env.example .env    # then set VITE_API_BASE_URL
npm run dev             # http://localhost:3000
```

```bash
npm run build           # production build to dist/
npm run preview         # serve the build on port 3000
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL of the Express backend, e.g. `http://localhost:5000`. Trailing slashes are stripped. Leave empty to start in demo-fixture mode. |
| `VITE_DEMO_STUDENT_ID` / `VITE_DEMO_STAFF_ID` / `VITE_DEMO_ADMIN_ID` | Optional seeded user IDs, sent as `userId` on requests such as complaint creation. |

Never put Gemini or other LLM keys in this project. Every `VITE_` variable ships to the browser, so LLM calls belong on the backend.

## Data sources: Live API vs demo fixtures

The sidebar has a **Data source** toggle:

- **Live API**: every call goes through `src/api/client.js` to `VITE_API_BASE_URL`.
- **Demo fixtures**: an in-browser mock (`src/demo/`) that implements the same service interface, including a simulated agent run, so the full flow can be demoed with no backend. A banner and "Simulated" badges mark this data so it is never mistaken for real meter readings.

If `VITE_API_BASE_URL` is empty, the app starts in demo mode.

## API endpoints used

All routes live in `src/api/endpoints.js`. Keep that file in sync with `API_CONTRACT.md`.

| Method | Path | Used by |
| --- | --- | --- |
| GET / POST | `/api/complaints` | Report an issue |
| GET | `/api/usage?building&resource&range` | Usage chart, building overview |
| GET | `/api/anomalies` | Dashboard anomaly list |
| POST | `/api/agent/run` | "Run agent now" |
| GET | `/api/agent/logs` | Agent activity (polled every 3s) |
| POST | `/api/agent/chat` | Ask the agent |
| GET / POST | `/api/tickets` | Ticket board |
| PATCH | `/api/tickets/:id` | Ticket status updates |
| GET | `/api/approvals` | Approval queue |
| POST | `/api/approvals/:id/decision` | Approve / reject |
| GET | `/api/notifications` | Inbox |
| PATCH | `/api/notifications/:id/read` | Mark as read |
| GET | `/api/impact` | Impact counters |

Request and response field names follow the contract exactly. `src/api/adapters.js` only unwraps common envelopes (`{ data }`, `{ items }`, and similar) and normalizes `_id`/`id`. It does not rename contract fields.

## Roles

The **Demo role** switcher (Student, Facility Staff, Sustainability Head) only changes which pages appear in the navigation. It is a UI convenience, not security. The backend must enforce real permissions.

## Project structure

```
src/
  api/          client, endpoints, adapters, one service module per resource
  demo/         fixtures + in-browser mock API (same interface as src/api)
  context/      app mode/role context, toasts
  hooks/        useResource (SWR wrapper that picks live or demo API)
  components/   layout shell, dashboard widgets, shared UI primitives
  pages/        Dashboard, Complaints, Tickets, Activity, Approvals, Notifications, Chat
  lib/          constants and formatters
```

## Tech

React 19, Vite, React Router, SWR, Recharts, Tailwind CSS v4, lucide-react.
