// DEMO API — in-memory stand-in with the same function signatures as src/api.
// Used only in "Demo fixtures" mode. Nothing here is ever shown as live backend data.
import { RANGES } from '../lib/constants'
import { DEMO_ASSUMPTIONS, DEMO_BUILDINGS, initialState } from './fixtures'

let state = initialState()
let seq = 1000
const nextId = (p) => `${p}-${++seq}`
const now = () => new Date().toISOString()
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms))
const clone = (v) => structuredClone(v)

function hoursFor(range) {
  return RANGES.find((r) => r.value === range)?.hours ?? 168
}

function addLog(entry) {
  state.logs.push({ _id: nextId('l'), timestamp: now(), ...entry })
}

function notify(to, message) {
  state.notifications.unshift({ _id: nextId('n'), to, message, read: false, createdAt: now() })
}

// Plays the agent loop step by step so the activity log fills in live during a demo.
function playAgentRun(trigger, steps) {
  steps.forEach((step, i) => {
    setTimeout(() => {
      const result = step.run ? step.run() : step.result
      addLog({ trigger, step: i + 1, thought: step.thought, tool: step.tool, result })
    }, 700 * (i + 1))
  })
}

function complaintRun(complaint) {
  const building = DEMO_BUILDINGS.find((b) => complaint.location.toLowerCase().includes(b.name.toLowerCase()))
  const resource = complaint.type === 'water_leak' ? 'water' : 'electricity'
  const anomaly = building && state.anomalies.find((a) => a.buildingId === building.id && a.resource === resource)
  const priority = anomaly ? 'high' : complaint.type === 'waste' ? 'low' : 'medium'
  let ticketId

  playAgentRun('complaint', [
    { thought: `New complaint: "${complaint.description}" at ${complaint.location}.`, tool: null, result: { complaintId: complaint._id, type: complaint.type } },
    { thought: `Checking recent ${resource} usage for ${building?.name ?? 'the location'}.`, tool: 'get_usage', result: { building: building?.id ?? 'unknown', resource, range: '24h' } },
    {
      thought: anomaly ? `Found a matching anomaly: ${anomaly.description} Linking it to the complaint.` : 'No matching anomaly in meter data; relying on the complaint alone.',
      tool: 'detect_anomalies',
      result: anomaly ? { zScore: anomaly.zScore, value: anomaly.value, baseline: anomaly.baseline } : { anomalies: 0 },
    },
    { thought: 'Checking open tickets at this location to avoid duplicates.', tool: 'get_open_tickets', result: { location: complaint.location, count: 0 } },
    {
      thought: `Creating a ${priority}-priority ticket${anomaly ? ' backed by meter evidence' : ''}.`,
      tool: 'create_ticket',
      run: () => {
        ticketId = nextId('t')
        state.tickets.unshift({
          _id: ticketId,
          location: complaint.location,
          issue: complaint.description,
          priority,
          cause: anomaly ? anomaly.description : `Reported by complaint ${complaint._id}.`,
          action: resource === 'water' ? 'Inspect and repair the leak; check tank float valve.' : 'Switch off unused loads; add occupancy signage.',
          assignee: '',
          status: 'open',
          createdAt: now(),
        })
        return { ticketId, priority }
      },
    },
    {
      thought: `Assigning to the ${resource === 'water' ? 'Plumbing' : complaint.type === 'waste' ? 'Housekeeping' : 'Electrical'} team based on issue type.`,
      tool: 'assign_staff',
      run: () => {
        const team = resource === 'water' ? 'Plumbing team' : complaint.type === 'waste' ? 'Housekeeping' : 'Electrical team'
        const t = state.tickets.find((x) => x._id === ticketId)
        if (t) Object.assign(t, { assignee: team, status: 'assigned' })
        const c = state.complaints.find((x) => x._id === complaint._id)
        if (c) c.status = 'assigned'
        return { ticketId, team }
      },
    },
    {
      thought: 'Notifying assigned staff.',
      tool: 'send_notification',
      run: () => {
        notify('staff', `Ticket ${ticketId} assigned: ${complaint.description} (${complaint.location}).`)
        return { to: 'staff', delivered: true }
      },
    },
    ...(priority === 'high'
      ? [
          {
            thought: 'High priority with meter evidence — requesting admin approval for an emergency repair call-out.',
            tool: 'request_approval',
            run: () => {
              const id = nextId('a')
              state.approvals.unshift({ _id: id, action: `Emergency repair call-out for ticket ${ticketId}`, reason: `${anomaly.description} Out-of-hours call-out exceeds the auto-approval cost limit.`, status: 'pending', createdAt: now() })
              notify('admin', `Approval needed: emergency repair call-out for ${complaint.location}.`)
              return { approvalId: id, status: 'pending' }
            },
          },
        ]
      : []),
  ])
}

export async function listComplaints() {
  await delay()
  return clone(state.complaints).map((c) => ({ ...c, id: c._id }))
}

export async function createComplaint({ userId, type, location, description, image }) {
  await delay(400)
  const complaint = { _id: nextId('c'), userId, type, location, description, imageUrl: image ? URL.createObjectURL(image) : '', status: 'open', createdAt: now() }
  state.complaints.unshift(complaint)
  state.impact.issuesDetected += 1
  complaintRun(complaint)
  return { ...clone(complaint), id: complaint._id }
}

export async function getUsage({ building, resource, range } = {}) {
  await delay(150)
  const since = Date.now() - hoursFor(range) * 3600 * 1000
  return state.readings.filter(
    (r) => (!building || r.buildingId === building) && (!resource || r.resource === resource) && new Date(r.timestamp).getTime() >= since,
  )
}

export async function getAnomalies({ building, range } = {}) {
  await delay(150)
  const since = Date.now() - hoursFor(range ?? '14d') * 3600 * 1000
  return clone(state.anomalies.filter((a) => (!building || a.buildingId === building) && new Date(a.timestamp).getTime() >= since)).map((a) => ({ ...a, id: a._id }))
}

export async function listTickets() {
  await delay()
  return clone(state.tickets).map((t) => ({ ...t, id: t._id }))
}

export async function createTicket(fields) {
  await delay()
  const ticket = { _id: nextId('t'), assignee: '', status: 'open', createdAt: now(), ...fields }
  state.tickets.unshift(ticket)
  return { ...clone(ticket), id: ticket._id }
}

export async function updateTicket(id, changes) {
  await delay()
  const t = state.tickets.find((x) => x._id === id)
  if (!t) throw new Error(`Ticket ${id} not found (demo)`)
  const wasResolved = t.status === 'resolved'
  Object.assign(t, changes)

  if (!wasResolved && t.status === 'resolved') {
    const water = /leak|water|tank|tap/i.test(`${t.issue} ${t.cause}`)
    const kwhSaved = water ? 0 : 60 + Math.round(Math.random() * 80)
    const litresSaved = water ? 4000 + Math.round(Math.random() * 6000) : 0
    const impact = {
      kwhSaved,
      litresSaved,
      rupeesSaved: Math.round(kwhSaved * DEMO_ASSUMPTIONS.tariffPerKwh + litresSaved * DEMO_ASSUMPTIONS.tariffPerLitre),
      co2Saved: Math.round((kwhSaved * DEMO_ASSUMPTIONS.co2PerKwh + litresSaved * DEMO_ASSUMPTIONS.co2PerLitre) * 10) / 10,
    }
    t.impact = impact
    state.impact.kwhSaved += impact.kwhSaved
    state.impact.litresSaved += impact.litresSaved
    state.impact.rupeesSaved += impact.rupeesSaved
    state.impact.co2Saved = Math.round((state.impact.co2Saved + impact.co2Saved) * 10) / 10
    state.impact.issuesResolved += 1
    playAgentRun('ticket_resolved', [
      { thought: `Ticket ${id} marked resolved. Calculating savings against the pre-fix baseline.`, tool: 'calculate_impact', result: impact },
      { thought: 'Informing the admin of the verified savings.', tool: 'send_notification', run: () => (notify('admin', `Ticket ${id} resolved: ${kwhSaved} kWh, ${litresSaved} L, ₹${impact.rupeesSaved} saved (estimated).`), { to: 'admin', delivered: true }) },
    ])
  }
  return { ...clone(t), id: t._id }
}

export async function listApprovals() {
  await delay()
  return clone(state.approvals).map((a) => ({ ...a, id: a._id }))
}

export async function decideApproval(id, decision) {
  await delay()
  const a = state.approvals.find((x) => x._id === id)
  if (!a) throw new Error(`Approval ${id} not found (demo)`)
  if (a.status !== 'pending') throw new Error(`Approval already ${a.status}`)
  a.status = decision
  addLog({ trigger: 'approval', step: 1, thought: `Admin ${decision} "${a.action}".`, tool: decision === 'approved' ? 'execute_action' : null, result: { approvalId: id, status: decision } })
  notify('staff', `Action ${decision} by admin: ${a.action}.`)
  return { ...clone(a), id: a._id }
}

export async function listNotifications() {
  await delay()
  return clone(state.notifications).map((n) => ({ ...n, id: n._id }))
}

export async function markNotificationRead(id) {
  await delay(100)
  const n = state.notifications.find((x) => x._id === id)
  if (n) n.read = true
  return n ? { ...clone(n), id: n._id } : null
}

export async function runAgent() {
  await delay(300)
  const open = state.tickets.filter((t) => t.status !== 'resolved').length
  const pendingAnoms = state.anomalies.slice(0, 2)
  playAgentRun('manual', [
    { thought: 'Manual run requested. Scanning all buildings for the last 24 hours.', tool: 'detect_anomalies', result: { range: '24h', found: pendingAnoms.length } },
    { thought: `Reviewing ${open} open tickets for anything stalled or duplicated.`, tool: 'get_open_tickets', result: { count: open } },
    { thought: 'All current anomalies already have tickets. No new actions needed.', tool: null, result: { actions: 0 } },
  ])
  return { status: 'started', trigger: 'manual' }
}

export async function getAgentLogs() {
  await delay(100)
  return clone(state.logs).map((l) => ({ ...l, id: l._id }))
}

export async function chatWithAgent(message) {
  await delay(700)
  const q = message.toLowerCase()
  if (q.includes('report')) {
    const i = state.impact
    const resolved = state.tickets.filter((t) => t.status === 'resolved').length
    return {
      reply: `Weekly sustainability report (demo)\n\n• Issues detected: ${i.issuesDetected}, resolved: ${resolved}\n• Electricity saved: ${i.kwhSaved} kWh\n• Water saved: ${i.litresSaved} L\n• Estimated savings: ₹${i.rupeesSaved}, ${i.co2Saved} kg CO2 avoided\n• Top concern: Hostel B overnight water flow.\n\nRecommendation: add a night-time valve check to the Hostel B maintenance routine.`,
    }
  }
  if (q.includes('top') || q.includes('problem')) {
    const top = state.anomalies.slice(0, 3).map((a, idx) => `${idx + 1}. ${DEMO_BUILDINGS.find((b) => b.id === a.buildingId)?.name}: ${a.description}`)
    return { reply: `Top problems right now:\n${top.join('\n')}` }
  }
  return { reply: 'I can summarise top problems, explain a ticket, or generate the weekly report. (Demo mode — answers come from fixtures, not the LLM.)' }
}

export async function getImpact() {
  await delay(150)
  return { ...clone(state.impact), assumptions: DEMO_ASSUMPTIONS }
}

export function resetDemo() {
  state = initialState()
}
