export const DEMO_USERS = [
  { id: 'demo-student', name: 'Aarav Student', role: 'student', email: 'aarav@campus.edu' },
  { id: 'demo-staff', name: 'Facilities Staff', role: 'staff', team: 'plumbing', email: 'facilities@campus.edu' },
  { id: 'demo-admin', name: 'Sustainability Admin', role: 'admin', email: 'sustainability@campus.edu' },
]

export const DEMO_BUILDINGS = [
  { id: 'building-hostel-a', name: 'Hostel A', type: 'hostel', elecBase: 42, waterBase: 900 },
  { id: 'building-hostel-b', name: 'Hostel B', type: 'hostel', elecBase: 38, waterBase: 850 },
  { id: 'building-academic', name: 'Academic Block', type: 'academic', elecBase: 70, waterBase: 300 },
  { id: 'building-library', name: 'Library', type: 'academic', elecBase: 30, waterBase: 80 },
  { id: 'building-labs', name: 'Labs & Workshop', type: 'lab', elecBase: 85, waterBase: 220 },
]

export const IMPACT_ASSUMPTIONS = {
  electricityTariffInrPerKwh: 8,
  waterCostInrPerLitre: 0.05,
  electricityEmissionKgCo2PerKwh: 0.67,
  waterEmissionKgCo2PerLitre: 0.0003,
}

export const TEAMS = [
  { id: 'plumbing', name: 'Plumbing team' },
  { id: 'electrical', name: 'Electrical team' },
  { id: 'housekeeping', name: 'Housekeeping' },
  { id: 'facilities', name: 'General Facilities' },
]

export const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash'

