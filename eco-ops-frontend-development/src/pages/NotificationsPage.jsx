import { useState } from 'react'
import { CheckCheck } from 'lucide-react'
import { Card, PageHeader, Button, AsyncBoundary, EmptyState, Badge } from '../components/ui'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { useResource } from '../hooks/useResource'
import { matchesRecipient } from '../components/layout/AppLayout'
import { POLL } from '../config'
import { fmtRelative } from '../lib/format'

function kindOf(message = '') {
  const m = message.toLowerCase()
  if (m.includes('approv')) return { label: 'Approval', tone: 'amber' }
  if (m.includes('resolved')) return { label: 'Resolution', tone: 'green' }
  if (m.includes('assign')) return { label: 'Assignment', tone: 'blue' }
  return { label: 'Update', tone: 'neutral' }
}

export default function NotificationsPage() {
  const { api, role, user, refreshAll } = useApp()
  const toast = useToast()
  const swr = useResource('notifications', 'listNotifications', null, { refreshInterval: POLL.live })
  const [busy, setBusy] = useState(null)
  const mine = (list) => list.filter((n) => matchesRecipient(n, role, user.id))

  async function markRead(ids) {
    setBusy(ids.length > 1 ? 'all' : ids[0])
    try {
      await Promise.all(ids.map((id) => api.markNotificationRead(id)))
      refreshAll()
    } catch (err) {
      toast.error(`Couldn't mark as read: ${err.message}`)
    } finally {
      setBusy(null)
    }
  }

  const unreadIds = mine(swr.data ?? []).filter((n) => !n.read).map((n) => n.id)

  return (
    <>
      <PageHeader
        title="Inbox"
        description="Simulated staff and admin messages: assignments, approvals, and resolutions. No real SMS or email is sent."
        actions={unreadIds.length > 0 && (
          <Button variant="secondary" loading={busy === 'all'} onClick={() => markRead(unreadIds)}>
            <CheckCheck className="size-4" aria-hidden />
            Mark all read
          </Button>
        )}
      />
      <Card>
        <AsyncBoundary swr={swr} isEmpty={(d) => mine(d).length === 0} empty={<EmptyState title="Inbox is empty" description="Messages from the agent will appear here." />}>
          {(data) => (
            <ul className="divide-y divide-line">
              {mine(data).map((n) => {
                const kind = kindOf(n.message)
                return (
                  <li key={n.id} className={`flex items-start gap-3 px-5 py-4 ${n.read ? '' : 'bg-primary/[0.03]'}`}>
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-primary'}`} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={kind.tone}>{kind.label}</Badge>
                        <span className="text-[11px] text-muted">To: {n.to}</span>
                        {n.createdAt && <span className="text-[11px] text-muted">{fmtRelative(n.createdAt)}</span>}
                        <span className="sr-only">{n.read ? 'Read' : 'Unread'}</span>
                      </div>
                      <p className={`mt-1.5 text-pretty text-sm leading-relaxed ${n.read ? 'text-muted' : 'font-medium text-fg'}`}>{n.message}</p>
                    </div>
                    {!n.read && (
                      <Button size="sm" variant="ghost" loading={busy === n.id} onClick={() => markRead([n.id])}>
                        Mark read
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </AsyncBoundary>
      </Card>
    </>
  )
}
