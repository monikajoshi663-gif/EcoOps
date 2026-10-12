# Frontend Implementation Guide - EcoOps

## Architecture Overview
The EcoOps frontend is a single-page React application built with Vite, Tailwind CSS v4, Lucide icons, SWR for caching/polling, and Recharts for time-series visualization.

### Layer Separation
1. **Presentation (`src/pages/`, `src/components/`):**
   - Clean, role-aware views gated by user persona (`student`, `staff`, `admin`).
   - Accessible UI components with semantic markup, loading states, and empty states.
2. **State & Context (`src/context/`):**
   - `AppContext`: Holds data source mode (`live` vs `demo`), active role, demo user credentials, and global SWR revalidation.
   - `ToastContext`: Floating notifications for immediate action feedback.
3. **Data Access (`src/api/` & `src/demo/`):**
   - Pluggable API client adhering to `EcoOps/api_contrac.md`.
   - `adapters.js`: Transparent normalization between server responses and UI expectations.
   - `src/demo/`: In-browser mock engine for zero-dependency hackathon demonstrations.

## Configuration
- `VITE_API_BASE_URL`: Base URL for Express backend (default: `http://localhost:5000`). If omitted, launches in Demo Fixtures mode.
- Seeded demo users:
  - Student: `demo-student`
  - Staff: `demo-staff`
  - Admin: `demo-admin`
