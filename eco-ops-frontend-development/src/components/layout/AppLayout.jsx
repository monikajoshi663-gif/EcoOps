import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  Activity,
  Bell,
  ClipboardCheck,
  KanbanSquare,
  LayoutDashboard,
  Leaf,
  Menu,
  MessageSquareText,
  MessageSquareWarning,
  X,
  User,
  LogIn,
  LogOut,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { NAV_BY_ROLE, ROLES } from '../../lib/constants'
import { API_BASE_URL, DEMO_USERS, HAS_BACKEND } from '../../config'
import { useResource } from '../../hooks/useResource'
import { POLL } from '../../config'

const NAV = {
  dashboard: { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  complaints: { to: '/complaints', label: 'Report an issue', icon: MessageSquareWarning },
  tickets: { to: '/tickets', label: 'Ticket board', icon: KanbanSquare },
  activity: { to: '/activity', label: 'Agent activity', icon: Activity },
  approvals: { to: '/approvals', label: 'Approval queue', icon: ClipboardCheck },
  notifications: { to: '/notifications', label: 'Inbox', icon: Bell },
  chat: { to: '/chat', label: 'Ask the agent', icon: MessageSquareText },
}

export function matchesRecipient(n, role, userId) {
  return role === 'admin' || n.to === role || n.to === userId || n.to === 'all'
}

function Sidebar({ onNavigate }) {
  const { role, user } = useApp()
  const { data: notifications } = useResource('notifications', 'listNotifications', null, { refreshInterval: POLL.live })
  const { data: approvals } = useResource('approvals', 'listApprovals', null, { refreshInterval: role === 'admin' ? POLL.live : 0 })
  const unread = (notifications ?? []).filter((n) => !n.read && matchesRecipient(n, role, user.id)).length
  const pending = (approvals ?? []).filter((a) => a.status === 'pending').length
  const counts = { notifications: unread, approvals: role === 'admin' ? pending : 0 }

  return (
    <nav aria-label="Main" className="flex flex-col gap-1 px-3">
      {NAV_BY_ROLE[role].map((key) => {
        const item = NAV[key]
        const Icon = item.icon
        return (
          <NavLink
            key={key}
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive ? 'bg-primary/10 font-medium text-primary' : 'text-muted hover:bg-surface-2 hover:text-fg'
              }`
            }
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="flex-1">{item.label}</span>
            {counts[key] > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-fg">
                {counts[key]}
                <span className="sr-only"> pending</span>
              </span>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-6">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-fg">
        <Leaf className="size-4" aria-hidden />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-fg">EcoOps</p>
        <p className="text-[11px] text-muted">Campus sustainability</p>
      </div>
    </div>
  )
}

function ControlPanel() {
  const { mode, setMode, role, setRole, user, isCustomAuth, logout } = useApp()
  return (
    <div className="flex flex-col gap-4 border-t border-line px-6 py-5">
      {/* Account / Auth Widget */}
      <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-2 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="size-4 text-primary" />
            <span className="text-xs font-semibold text-fg truncate max-w-[120px]">{user?.name || 'Guest'}</span>
          </div>
          <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary uppercase">
            {role}
          </span>
        </div>

        {isCustomAuth ? (
          <button
            type="button"
            onClick={logout}
            className="mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-line bg-surface py-1 text-xs font-medium text-muted hover:text-fg"
          >
            <LogOut className="size-3" /> Log Out
          </button>
        ) : (
          <Link
            to="/auth"
            className="mt-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary py-1.5 text-xs font-semibold text-primary-fg shadow-sm hover:opacity-90"
          >
            <LogIn className="size-3" /> Sign In / Sign Up
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="role-select" className="text-[11px] font-medium uppercase tracking-wider text-muted">
          Demo role
        </label>
        <select
          id="role-select"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-lg border border-line bg-bg px-2.5 py-2 text-sm text-fg focus:border-primary focus:outline-none"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {DEMO_USERS[r].name}
            </option>
          ))}
        </select>
        <p className="text-[11px] leading-relaxed text-muted">UI only. The backend enforces real permissions.</p>
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted">Data source</legend>
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-bg p-1">
          {[
            { value: 'live', label: 'Live API' },
            { value: 'demo', label: 'Demo fixtures' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={mode === opt.value}
              onClick={() => setMode(opt.value)}
              className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                mode === opt.value ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="break-all font-mono text-[11px] text-muted">{HAS_BACKEND ? API_BASE_URL : 'VITE_API_BASE_URL not set'}</p>
      </fieldset>
    </div>
  )
}

function DataSourceBanner() {
  const { isDemo, setMode } = useApp()
  if (isDemo) {
    return (
      <div className="border-b border-warn/30 bg-warn/10 px-4 py-2 text-xs text-warn md:px-8" role="status">
        <strong className="font-semibold">Demo fixtures:</strong> data and agent runs below are simulated in the browser, not from the backend.{' '}
        {HAS_BACKEND && (
          <button onClick={() => setMode('live')} className="font-semibold underline underline-offset-2">
            Switch to live API
          </button>
        )}
      </div>
    )
  }
  if (!HAS_BACKEND) {
    return (
      <div className="border-b border-danger/30 bg-danger/10 px-4 py-2 text-xs text-danger md:px-8" role="status">
        <strong className="font-semibold">Live API selected, but no backend configured.</strong> Set VITE_API_BASE_URL in .env, or{' '}
        <button onClick={() => setMode('demo')} className="font-semibold underline underline-offset-2">
          use demo fixtures
        </button>
        .
      </div>
    )
  }
  return null
}

export function AppLayout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-full">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-line bg-surface py-5 lg:flex">
        <div className="flex flex-col gap-6">
          <Brand />
          <Sidebar />
        </div>
        <ControlPanel />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button className="absolute inset-0 bg-black/60" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-72 flex-col justify-between overflow-y-auto border-r border-line bg-surface py-5">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pr-4">
                <Brand />
                <button onClick={() => setOpen(false)} className="text-muted hover:text-fg" aria-label="Close navigation">
                  <X className="size-5" />
                </button>
              </div>
              <Sidebar onNavigate={() => setOpen(false)} />
            </div>
            <ControlPanel />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="text-fg" aria-label="Open navigation">
              <Menu className="size-5" />
            </button>
            <span className="text-sm font-semibold">EcoOps</span>
          </div>
          <Link to="/auth" className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-medium text-fg">
            <LogIn className="size-3.5 text-primary" /> Sign In
          </Link>
        </div>
        <DataSourceBanner />
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
