import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { useApp } from './context/AppContext'
import { NAV_BY_ROLE } from './lib/constants'
import DashboardPage from './pages/DashboardPage'
import ComplaintsPage from './pages/ComplaintsPage'
import TicketsPage from './pages/TicketsPage'
import ActivityPage from './pages/ActivityPage'
import ApprovalsPage from './pages/ApprovalsPage'
import NotificationsPage from './pages/NotificationsPage'
import ChatPage from './pages/ChatPage'

function RoleGate({ page, children }) {
  const { role } = useApp()
  return NAV_BY_ROLE[role].includes(page) ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="complaints" element={<RoleGate page="complaints"><ComplaintsPage /></RoleGate>} />
        <Route path="tickets" element={<RoleGate page="tickets"><TicketsPage /></RoleGate>} />
        <Route path="activity" element={<RoleGate page="activity"><ActivityPage /></RoleGate>} />
        <Route path="approvals" element={<RoleGate page="approvals"><ApprovalsPage /></RoleGate>} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
