# Frontend Status - EcoOps

**Last Updated:** 2026-10-12
**Status:** Working / Verified

## 1. What is Implemented & Verified
- **Build System:** Vite 8.3 + React 19 + Tailwind CSS v4 builds with 0 errors (`npm run build`).
- **Demo Fixture Mode:** Standalone in-browser mock engine (`src/demo/`) simulates full autonomous loop without a backend.
- **Role Switcher:** Dynamic switcher supporting Student (`demo-student`), Staff (`demo-staff`), and Admin (`demo-admin`).
- **Dashboard Overview:** Time-series area charts for Electricity and Water, building summary cards, anomaly lists, and aggregate campus impact counters.
- **Complaint Submission:** Multipart/form-data support for issue reports with optional photo attachment and auto-investigation trigger.
- **Ticket Kanban Board:** Drag-and-drop / column layout for tickets (`open`, `assigned`, `in_progress`, `resolved`) with inline resolution notes and estimated impact computation.
- **Autonomous Activity Stream:** Real-time reasoning log showing agent observations, tool executions, and step-by-step rationale.
- **Admin Approvals:** High-impact action queue with human-in-the-loop Approve/Reject controls.
- **In-App Inbox:** Simulated notifications for assignments, resolutions, and approvals with mark-as-read functionality.
- **Agent Chat:** Interactive chat portal with prompt suggestions and sustainability report queries.

## 2. Issues Fixed In-Place
- **Demo User Header:** Fixed `src/api/client.js` and `src/context/AppContext.jsx` to dynamically attach `X-Demo-User-Id` to all API requests based on selected role.
- **API Response Envelope Unwrapping:** Updated `src/api/adapters.js` to correctly unwrap `{ data: { items: [...] } }` and nested payloads returned by the live API contract.
- **Impact Metric Normalization:** Added key aliasing in `adapters.js` between contract keys (`electricitySavedKwh`, `waterSavedLitres`, etc.) and UI keys (`kwhSaved`, `litresSaved`, etc.).
- **Notification Endpoint:** Aligned `endpoints.js` and `notifications.js` with `PATCH /api/notifications/:id` and `{ read: true }`.
- **Query Parameter Matching:** Updated `usage.js` and `anomalies.js` services to support both `buildingId` and `building`.

## 3. Current State & Next Steps
- **Current State:** Frontend verified and fully operational in both Demo Fixtures mode and Live Backend integration mode.
- **Next Step:** Run the Vite dev server (`npm run dev`) or connect to the running Express backend service on port 5000.
