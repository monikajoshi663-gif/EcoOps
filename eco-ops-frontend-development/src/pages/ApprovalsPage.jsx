import { useState } from 'react'
import { Check, ShieldAlert, X } from 'lucide-react'
import { Card, CardHeader, PageHeader, Button, AsyncBoundary, EmptyState, StatusBadge } from '../components/ui'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { useResource } from '../hooks/useResource'
import { POLL } from '../config'
import { fmtRelative } from '../lib/format'

function ApprovalRow({ approval }) {
  const { api, refreshAll, role } = useApp()
  const toast = useToast()
  const [busy, setBusy] = useState(null)

  async function decide(decision) {
    setBusy(decision)
    try {
      const updated = await api.decideApproval(approval.id, decision)
      toast.success(`Action ${updated?.status ?? decision}.`)
      refreshAll()
    } catch (err) {
      toast.error(`Decision failed: ${err.message}`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <li className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-fg">{approval.action}</p>
          <StatusBadge status={approval.status} />
        </div>
        <p className="mt-1 text-pretty text-xs leading-relaxed text-muted">
          <span className="font-medium text-fg">Why approval is needed: </span>
          {approval.reason}
        </p>
        {approval.createdAt && <p className="mt-1 text-[11px] text-muted">Requested {fmtRelative(approval.createdAt)}</p>}
      </div>
      {approval.status === 'pending' && role === 'admin' && (
        <div className="flex gap-2">
          <Button size="sm" variant="danger" loading={busy === 'rejected'} disabled={!!busy} onClick={() => decide('rejected')}>
            {busy !== 'rejected' && <X className="size-3.5" aria-hidden />}
            Reject
          </Button>
          <Button size="sm" loading={busy === 'approved'} disabled={!!busy} onClick={() => decide('approved')}>
            {busy !== 'approved' && <Check className="size-3.5" aria-hidden />}
            Approve
          </Button>
        </div>
      )}
    </li>
  )
}

export default function ApprovalsPage() {
  const { role } = useApp()
  const swr = useResource('approvals', 'listApprovals', null, { refreshInterval: POLL.live })

  return (
    <>
      <PageHeader title="Approval queue" description="High-impact agent actions wait here for a human decision before they run." />
      {role !== 'admin' && (
        <p className="flex items-center gap-2 rounded-lg border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
          <ShieldAlert className="size-4" aria-hidden />
          Only admins can approve or reject actions.
        </p>
      )}
      <AsyncBoundary swr={swr} isEmpty={(d) => d.length === 0} empty={<Card><EmptyState title="Queue is empty" description="The agent hasn't requested any high-impact actions." /></Card>}>
        {(approvals) => {
          const pending = approvals.filter((a) => a.status === 'pending')
          const decided = approvals.filter((a) => a.status !== 'pending')
          return (
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader title={`Pending (${pending.length})`} />
                {pending.length ? <ul className="divide-y divide-line">{pending.map((a) => <ApprovalRow key={a.id} approval={a} />)}</ul> : <EmptyState title="Nothing pending" />}
              </Card>
              {decided.length > 0 && (
                <Card>
                  <CardHeader title="Decided" />
                  <ul className="divide-y divide-line">{decided.map((a) => <ApprovalRow key={a.id} approval={a} />)}</ul>
                </Card>
              )}
            </div>
          )
        }}
      </AsyncBoundary>
    </>
  )
}
