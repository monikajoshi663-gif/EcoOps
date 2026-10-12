// DEMO FIXTURES — simulated data used only when the app is in "Demo fixtures" mode.
// Shapes mirror the PRD data models so switching to the live backend needs no UI changes.

const HOUR = 3600 * 1000

function seeded(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export const DEMO_BUILDINGS = [
  { id: 'hostel-a', name: 'Hostel A', type: 'hostel', elec: 42, water: 900 },
  { id: 'hostel-b', name: 'Hostel B', type: 'hostel', elec: 38, water: 850 },
  { id: 'academic', name: 'Academic Block', type: 'academic', elec: 70, water: 300 },
  { id: 'library', name: 'Library', type: 'academic', elec: 30, water: 80 },
  { id: 'labs', name: 'Labs & Workshop', type: 'lab', elec: 85, water: 220 },
]

function dailyShape(type, resource, hour) {
  if (type === 'hostel') {
    const morning = Math.exp(-((hour - 7.5) ** 2) / 3)
    const evening = Math.exp(-((hour - 20) ** 2) / 6)
    return resource === 'water' ? 0.25 + morning * 1.4 + evening * 0.9 : 0.35 + morning * 0.5 + evening * 1.1
  }
  const working = hour >= 8 && hour <= 18 ? 1 : 0.18
  return resource === 'water' ? working * 0.9 + 0.1 : working
}

const INJECTED = [
  { buildingId: 'hostel-b', resource: 'water', hoursAgo: [28, 22], factor: 3.4, note: 'Overnight water flow ~3x baseline — consistent with a leak.' },
  { buildingId: 'academic', resource: 'electricity', hoursAgo: [52, 46], factor: 2.6, note: 'Lighting/AC load after hours on a non-teaching night.' },
  { buildingId: 'labs', resource: 'electricity', hoursAgo: [100, 94], factor: 2.2, note: 'Equipment left running overnight.' },
  { buildingId: 'hostel-a', resource: 'water', hoursAgo: [150, 146], factor: 2.8, note: 'Tank overflow pattern at 3–6 AM.' },
  { buildingId: 'library', resource: 'electricity', hoursAgo: [200, 194], factor: 3.1, note: 'HVAC running while building closed.' },
  { buildingId: 'hostel-b', resource: 'electricity', hoursAgo: [9, 5], factor: 2.1, note: 'Common-room ACs on with zero occupancy.' },
]

export function generateReadings(now = Date.now()) {
  const rand = seeded(42)
  const end = Math.floor(now / HOUR) * HOUR
  const readings = []
  const anomalies = []

  for (const b of DEMO_BUILDINGS) {
    for (const resource of ['electricity', 'water']) {
      const base = resource === 'water' ? b.water / 10 : b.elec
      for (let h = 335; h >= 0; h--) {
        const ts = end - h * HOUR
        const hour = new Date(ts).getHours()
        const baseline = base * dailyShape(b.type, resource, hour)
        let value = baseline * (0.9 + rand() * 0.2)
        const inj = INJECTED.find((a) => a.buildingId === b.id && a.resource === resource && h <= a.hoursAgo[0] && h >= a.hoursAgo[1])
        if (inj) value = Math.max(value, base * 0.6) * inj.factor
        readings.push({ buildingId: b.id, resource, timestamp: new Date(ts).toISOString(), value: Math.round(value * 10) / 10 })
        if (inj && h === Math.round((inj.hoursAgo[0] + inj.hoursAgo[1]) / 2)) {
          anomalies.push({
            _id: `anom-${b.id}-${resource}-${h}`,
            buildingId: b.id,
            resource,
            timestamp: new Date(ts).toISOString(),
            value: Math.round(value * 10) / 10,
            baseline: Math.round(baseline * 10) / 10,
            zScore: Math.round((inj.factor * 1.6 + 1) * 10) / 10,
            description: inj.note,
          })
        }
      }
    }
  }
  anomalies.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  return { readings, anomalies }
}

export function initialState(now = Date.now()) {
  const { readings, anomalies } = generateReadings(now)
  const ago = (h) => new Date(now - h * HOUR).toISOString()

  return {
    readings,
    anomalies,
    complaints: [
      { _id: 'c-101', userId: 'demo-student', type: 'light_ac_on', location: 'Academic Block, Room 312', description: 'All lights and two ACs on after 9 PM, room empty.', imageUrl: '', status: 'resolved', createdAt: ago(50) },
      { _id: 'c-102', userId: 'demo-student', type: 'waste', location: 'Labs & Workshop, Ground floor', description: 'Bins overflowing near the workshop entrance.', imageUrl: '', status: 'in_progress', createdAt: ago(20) },
    ],
    tickets: [
      { _id: 't-201', location: 'Academic Block, Room 312', issue: 'Lights/AC left on after hours', priority: 'medium', cause: 'After-hours electricity spike matches complaint c-101.', action: 'Switch off and add occupancy reminder signage.', assignee: 'Electrical team', status: 'resolved', resolutionNote: 'Switched off; signage added.', impact: { kwhSaved: 96, litresSaved: 0, rupeesSaved: 768, co2Saved: 78.7 }, createdAt: ago(49) },
      { _id: 't-202', location: 'Labs & Workshop', issue: 'Equipment left running overnight', priority: 'medium', cause: 'Night-time load 2.2x baseline for 6 hours.', action: 'Shut down idle equipment; review lab closing checklist.', assignee: 'Electrical team', status: 'in_progress', createdAt: ago(30) },
      { _id: 't-203', location: 'Labs & Workshop, Ground floor', issue: 'Overflowing waste bins', priority: 'low', cause: 'Student complaint c-102.', action: 'Empty bins and increase pickup frequency.', assignee: 'Housekeeping', status: 'assigned', createdAt: ago(19) },
      { _id: 't-204', location: 'Library', issue: 'HVAC running while closed', priority: 'medium', cause: 'Anomaly: electricity 3.1x baseline after closing.', action: 'Check BMS schedule for HVAC.', assignee: '', status: 'open', createdAt: ago(8) },
    ],
    approvals: [
      { _id: 'a-301', action: 'Shut off main water valve, Hostel A overnight', reason: 'Recurring tank overflow at 3–6 AM. Shutting the valve affects all residents, so admin approval is required.', status: 'pending', createdAt: ago(6) },
      { _id: 'a-302', action: 'Schedule emergency electrician for Labs & Workshop', reason: 'Cost above auto-approval threshold (₹2,000).', status: 'approved', createdAt: ago(28) },
    ],
    notifications: [
      { _id: 'n-401', to: 'staff', message: 'Ticket t-203 assigned to Housekeeping: Overflowing waste bins at Labs & Workshop.', read: false, createdAt: ago(19) },
      { _id: 'n-402', to: 'admin', message: 'Approval needed: Shut off main water valve, Hostel A overnight.', read: false, createdAt: ago(6) },
      { _id: 'n-403', to: 'demo-student', message: 'Your complaint about Academic Block, Room 312 was resolved. Estimated 96 kWh saved.', read: true, createdAt: ago(40) },
      { _id: 'n-404', to: 'staff', message: 'Ticket t-202 assigned to Electrical team: Equipment left running overnight.', read: true, createdAt: ago(30) },
    ],
    logs: [
      { _id: 'l-1', timestamp: ago(8.02), trigger: 'anomaly', step: 1, thought: 'New electricity anomaly at Library: 3.1x baseline while the building is closed.', tool: 'detect_anomalies', result: { buildingId: 'library', zScore: 5.9 } },
      { _id: 'l-2', timestamp: ago(8.01), trigger: 'anomaly', step: 2, thought: 'Checking for an existing ticket to avoid duplicates.', tool: 'get_open_tickets', result: { location: 'Library', count: 0 } },
      { _id: 'l-3', timestamp: ago(8), trigger: 'anomaly', step: 3, thought: 'No existing ticket. Medium priority: sustained waste but no safety risk.', tool: 'create_ticket', result: { ticketId: 't-204' } },
    ],
    impact: { kwhSaved: 96, litresSaved: 0, rupeesSaved: 768, co2Saved: 78.7, issuesDetected: 8, issuesResolved: 1 },
  }
}

export const DEMO_ASSUMPTIONS = {
  tariffPerKwh: 8,
  tariffPerLitre: 0.05,
  co2PerKwh: 0.82,
  co2PerLitre: 0.0003,
}
