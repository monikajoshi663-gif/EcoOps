import { useRef, useState } from 'react'
import { CheckCircle2, ImagePlus, Send, X } from 'lucide-react'
import { Card, CardHeader, PageHeader, Button, Field, inputClass, AsyncBoundary, EmptyState, StatusBadge, Badge } from '../components/ui'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { useResource } from '../hooks/useResource'
import { POLL } from '../config'
import { BUILDING_NAMES, COMPLAINT_TYPES, labelFor } from '../lib/constants'
import { fmtRelative } from '../lib/format'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function ComplaintForm({ onCreated }) {
  const { api, user, refreshAll } = useApp()
  const toast = useToast()
  const fileRef = useRef(null)
  const [form, setForm] = useState({ type: 'water_leak', building: 'Hostel B', room: '', description: '' })
  const [image, setImage] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(null)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('Photo must be an image file.')
    if (file.size > MAX_IMAGE_BYTES) return setError('Photo must be under 5 MB.')
    setError('')
    setImage(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const description = form.description.trim()
    const room = form.room.trim()
    if (description.length < 5) return setError('Please describe the issue (at least 5 characters).')
    setError('')
    setSubmitting(true)
    try {
      const bEntry = Object.entries(BUILDING_NAMES).find(([, name]) => name.toLowerCase() === form.building.toLowerCase())
      const buildingId = bEntry ? bEntry[0] : 'hostel-b'
      const complaint = await api.createComplaint({
        userId: user.id,
        type: form.type,
        buildingId,
        location: room ? `${form.building}, ${room}` : form.building,
        description,
        image,
      })
      setSubmitted(complaint)
      setForm((f) => ({ ...f, room: '', description: '' }))
      setImage(null)
      if (fileRef.current) fileRef.current.value = ''
      toast.success('Complaint submitted. The agent is investigating.')
      onCreated?.()
      refreshAll()
    } catch (err) {
      setError(`Submission failed: ${err.message}`)
      toast.error(`Complaint not submitted: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Report an issue" description="Submitting triggers the EcoOps agent to investigate and create a ticket." />
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5" noValidate>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-xs font-medium text-fg">Issue type</legend>
          <div className="grid grid-cols-2 gap-2">
            {COMPLAINT_TYPES.map((t) => (
              <label
                key={t.value}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                  form.type === t.value ? 'border-primary bg-primary/10 text-fg' : 'border-line text-muted hover:border-muted/60'
                }`}
              >
                <input type="radio" name="type" value={t.value} checked={form.type === t.value} onChange={set('type')} className="accent-primary" />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Building" htmlFor="building">
            <select id="building" className={inputClass} value={form.building} onChange={set('building')}>
              {Object.values(BUILDING_NAMES).map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </Field>
          <Field label="Room / floor" htmlFor="room">
            <input id="room" className={inputClass} value={form.room} onChange={set('room')} placeholder="e.g. 2nd floor washroom" maxLength={80} />
          </Field>
        </div>

        <Field label="Description" htmlFor="description">
          <textarea
            id="description"
            className={`${inputClass} min-h-24 resize-y`}
            value={form.description}
            onChange={set('description')}
            placeholder="Tap leaking continuously, water pooling on the floor."
            maxLength={1000}
            required
          />
        </Field>

        <Field label="Photo (optional)" htmlFor="photo" hint="JPG or PNG, up to 5 MB. The agent can use it to confirm severity.">
          {image ? (
            <div className="flex items-center gap-3 rounded-lg border border-line bg-bg px-3 py-2">
              <img src={URL.createObjectURL(image)} alt="Selected complaint photo preview" className="size-10 rounded object-cover" />
              <span className="flex-1 truncate text-sm text-fg">{image.name}</span>
              <button type="button" onClick={() => { setImage(null); if (fileRef.current) fileRef.current.value = '' }} className="text-muted hover:text-fg" aria-label="Remove photo">
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <label htmlFor="photo" className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-bg px-3 py-4 text-sm text-muted hover:border-primary hover:text-fg">
              <ImagePlus className="size-4" aria-hidden />
              Add a photo
            </label>
          )}
          <input ref={fileRef} id="photo" type="file" accept="image/*" onChange={handleFile} className="sr-only" />
        </Field>

        {error && <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{error}</p>}

        {submitted && !error && (
          <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary" role="status">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              Complaint <span className="font-mono">{submitted.id ?? 'received'}</span> submitted with status <strong>{submitted.status ?? 'open'}</strong>. Track it in the list.
            </p>
          </div>
        )}

        <Button type="submit" loading={submitting} className="self-start">
          {!submitting && <Send className="size-4" aria-hidden />}
          Submit complaint
        </Button>
      </form>
    </Card>
  )
}

function ComplaintList() {
  const { role, user } = useApp()
  const swr = useResource('complaints', 'listComplaints', null, { refreshInterval: POLL.live })
  const visible = (list) => (role === 'student' ? list.filter((c) => !c.userId || c.userId === user.id) : list)

  return (
    <Card>
      <CardHeader title={role === 'student' ? 'My complaints' : 'All complaints'} description="Status updates as the agent and staff act on them." />
      <AsyncBoundary
        swr={swr}
        isEmpty={(d) => visible(d).length === 0}
        empty={<EmptyState title="No complaints yet" description="Submitted complaints appear here with live status." />}
      >
        {(data) => (
          <ul className="divide-y divide-line">
            {visible(data).map((c) => (
              <li key={c.id} className="flex gap-3 px-5 py-4">
                {c.imageUrl && <img src={c.imageUrl} alt={`Photo for complaint at ${c.location}`} className="size-12 shrink-0 rounded-md object-cover" crossOrigin="anonymous" />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{labelFor(COMPLAINT_TYPES, c.type)}</Badge>
                    <StatusBadge status={c.status} />
                    {c.createdAt && <span className="text-[11px] text-muted">{fmtRelative(c.createdAt)}</span>}
                  </div>
                  <p className="mt-1.5 text-pretty text-sm text-fg">{c.description}</p>
                  <p className="mt-0.5 text-xs text-muted">{c.location}</p>

                  {c.aiAnalysis && (
                    <div className="mt-2.5 rounded-lg border border-primary/25 bg-primary/5 p-2.5 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-primary">
                        <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                        AI Diagnostic Analysis
                        {c.aiAnalysis.severity && (
                          <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                            c.aiAnalysis.severity === 'high' ? 'bg-danger/20 text-danger border border-danger/30' : 'bg-primary/20 text-primary border border-primary/30'
                          }`}>
                            {c.aiAnalysis.severity} severity
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-fg leading-relaxed">
                        <strong>Root Cause:</strong> {c.aiAnalysis.rootCause}
                      </p>
                      {c.aiAnalysis.recommendedAction && (
                        <p className="mt-0.5 text-muted">
                          <strong>Action:</strong> {c.aiAnalysis.recommendedAction}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </AsyncBoundary>
    </Card>
  )
}

export default function ComplaintsPage() {
  return (
    <>
      <PageHeader title="Complaint portal" description="Report water leaks, lights or ACs left on, and waste. The agent correlates your report with meter data." />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ComplaintForm />
        </div>
        <div className="lg:col-span-2">
          <ComplaintList />
        </div>
      </div>
    </>
  )
}
