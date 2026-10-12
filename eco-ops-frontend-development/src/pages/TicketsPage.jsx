import { useState } from 'react'
import { MapPin, Plus, User, Wrench } from 'lucide-react'
import { Card, PageHeader, Button, PriorityBadge, AsyncBoundary, EmptyState, Field, inputClass, Badge } from '../components/ui'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { useResource } from '../hooks/useResource'
import { POLL } from '../config'
import { PRIORITIES, TICKET_STATUSES } from '../lib/constants'
import { fmtInt, fmtRelative, fmtRupees } from '../lib/format'

function TicketCard({ ticket }) {
  const { api, refreshAll, role } = useApp()
  const toast = useToast()
  const [note, setNote] = useState(ticket.resolutionNote ?? '')
  const [saving, setSaving] = useState(false)
  const canEdit = role !== 'student'

  async function save(changes, successMsg) {
    setSaving(true)
    try {
      await api.updateTicket(ticket.id, changes)
      toast.success(successMsg)
      refreshAll()
    } catch (err) {
      toast.error(`Update failed: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <PriorityBadge priority={ticket.priority} />
        {ticket.createdAt && <span className="text-[11px] text-muted">{fmtRelative(ticket.createdAt)}</span>}
      </div>
      <div>
        <h3 className="text-pretty text-sm font-semibold leading-snug text-fg">{ticket.issue}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted">
          <MapPin className="size-3" aria-hidden />
          {ticket.location}
        </p>
      </div>
      {ticket.cause && (
        <p className="text-xs leading-relaxed text-muted">
          <span className="font-medium text-fg">Cause: </span>
          {ticket.cause}
        </p>
      )}
      {ticket.action && (
        <p className="flex gap-1.5 text-xs leading-relaxed text-muted">
          <Wrench className="mt-0.5 size-3 shrink-0 text-primary" aria-hidden />
          <span>{ticket.action}</span>
        </p>
      )}
      <p className="flex items-center gap-1.5 text-xs">
        <User className="size-3 text-muted" aria-hidden />
        <span className={ticket.assignee ? 'text-fg' : 'italic text-muted'}>{ticket.assignee || 'Unassigned'}</span>
      </p>

      {ticket.impact && (
        <div className="rounded-md border border-primary/20 bg-primary/5 px-2.5 py-2 font-mono text-[11px] text-primary">
          Saved {fmtInt(ticket.impact.kwhSaved)} kWh · {fmtInt(ticket.impact.litresSaved)} L · {fmtRupees(ticket.impact.rupeesSaved)} (est.)
        </div>
      )}

      {canEdit && (
        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <label className="sr-only" htmlFor={`status-${ticket.id}`}>Status</label>
          <select
            id={`status-${ticket.id}`}
            className={`${inputClass} py-1.5 text-xs`}
            value={ticket.status}
            disabled={saving}
            onChange={(e) => save({ status: e.target.value }, `Ticket moved to ${TICKET_STATUSES.find((s) => s.value === e.target.value)?.label}.`)}
          >
            {TICKET_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <label className="sr-only" htmlFor={`note-${ticket.id}`}>Resolution note</label>
          <textarea
            id={`note-${ticket.id}`}
            className={`${inputClass} min-h-14 text-xs`}
            placeholder="Resolution note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
          />
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" loading={saving} disabled={!note.trim() || note === (ticket.resolutionNote ?? '')} onClick={() => save({ resolutionNote: note.trim() }, 'Resolution note saved.')}>
              Save note
            </Button>
            {ticket.status !== 'resolved' && (
              <Button size="sm" loading={saving} onClick={() => save({ status: 'resolved', ...(note.trim() ? { resolutionNote: note.trim() } : {}) }, 'Ticket resolved. The agent will calculate the impact.')}>
                Resolve
              </Button>
            )}
          </div>
        </div>
      )}
      {!canEdit && ticket.resolutionNote && <p className="text-xs text-muted">Note: {ticket.resolutionNote}</p>}
    </Card>
  )
}

function NewTicketForm({ onDone }) {
  const { api, refreshAll } = useApp()
  const toast = useToast()
  const [form, setForm] = useState({ location: '', issue: '', priority: 'medium', cause: '', action: '' })
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.location.trim() || !form.issue.trim()) return toast.error('Location and issue are required.')
    setSaving(true)
    try {
      await api.createTicket(Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()])))
      toast.success('Ticket created.')
      refreshAll()
      onDone()
    } catch (err) {
      toast.error(`Ticket not created: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <Field label="Location" htmlFor="t-location"><input id="t-location" className={inputClass} value={form.location} onChange={set('location')} placeholder="Hostel B, 2nd floor" /></Field>
        <Field label="Issue" htmlFor="t-issue"><input id="t-issue" className={inputClass} value={form.issue} onChange={set('issue')} placeholder="Leaking tap" /></Field>
        <Field label="Priority" htmlFor="t-priority">
          <select id="t-priority" className={inputClass} value={form.priority} onChange={set('priority')}>
            {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </Field>
        <Field label="Cause" htmlFor="t-cause"><input id="t-cause" className={inputClass} value={form.cause} onChange={set('cause')} /></Field>
        <div className="md:col-span-2">
          <Field label="Recommended action" htmlFor="t-action"><input id="t-action" className={inputClass} value={form.action} onChange={set('action')} /></Field>
        </div>
        <div className="flex gap-2 md:col-span-2">
          <Button type="submit" loading={saving}>Create ticket</Button>
          <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        </div>
      </form>
    </Card>
  )
}

export default function TicketsPage() {
  const swr = useResource('tickets', 'listTickets', null, { refreshInterval: POLL.live })
  const { role } = useApp()
  const [creating, setCreating] = useState(false)

  return (
    <>
      <PageHeader
        title="Ticket board"
        description="Tickets created by the agent or manually. Move them through the workflow and add resolution notes."
        actions={role !== 'student' && !creating && (
          <Button variant="secondary" onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden />
            New ticket
          </Button>
        )}
      />
      {creating && <NewTicketForm onDone={() => setCreating(false)} />}
      <AsyncBoundary swr={swr} isEmpty={(d) => d.length === 0} empty={<Card><EmptyState title="No tickets" description="Tickets appear when the agent or staff create them." /></Card>}>
        {(tickets) => (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {TICKET_STATUSES.map((col) => {
              const items = tickets.filter((t) => t.status === col.value)
              return (
                <section key={col.value} aria-label={col.label} className="flex flex-col gap-3 rounded-xl bg-surface/50 p-3">
                  <h2 className="flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wider text-muted">
                    {col.label}
                    <Badge>{items.length}</Badge>
                  </h2>
                  {items.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-xs text-muted">Nothing here</p>
                  ) : (
                    items.map((t) => <TicketCard key={`${t.id}-${t.status}`} ticket={t} />)
                  )}
                </section>
              )
            })}
          </div>
        )}
      </AsyncBoundary>
    </>
  )
}
