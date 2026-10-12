// Enum values sent to / expected from the backend. Adjust here if API_CONTRACT.md differs.
export const COMPLAINT_TYPES = [
  { value: 'water_leak', label: 'Water leak' },
  { value: 'light_ac_on', label: 'Light / AC left on' },
  { value: 'waste', label: 'Waste' },
  { value: 'other', label: 'Other' },
]

export const TICKET_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
]

export const PRIORITIES = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

export const RESOURCES = [
  { value: 'electricity', label: 'Electricity', unit: 'kWh' },
  { value: 'water', label: 'Water', unit: 'L' },
]

export const RANGES = [
  { value: '24h', label: '24 hours', hours: 24 },
  { value: '7d', label: '7 days', hours: 168 },
  { value: '14d', label: '14 days', hours: 336 },
]

export const BUILDING_NAMES = {
  'hostel-a': 'Hostel A',
  'hostel-b': 'Hostel B',
  academic: 'Academic Block',
  library: 'Library',
  labs: 'Labs & Workshop',
  'building-hostel-a': 'Hostel A',
  'building-hostel-b': 'Hostel B',
  'building-academic-block': 'Academic Block',
  'building-library': 'Library',
  'building-canteen': 'Canteen',
  'building-labs': 'Labs & Workshop',
  canteen: 'Canteen',
}

export const ROLES = ['student', 'staff', 'admin']

export const NAV_BY_ROLE = {
  student: ['dashboard', 'complaints', 'notifications', 'chat'],
  staff: ['dashboard', 'tickets', 'activity', 'notifications', 'chat'],
  admin: ['dashboard', 'complaints', 'tickets', 'activity', 'approvals', 'notifications', 'chat'],
}

export function labelFor(list, value) {
  return list.find((item) => item.value === value)?.label ?? value ?? '—'
}

export function buildingName(id) {
  if (!id) return 'Campus Facility'
  if (BUILDING_NAMES[id]) return BUILDING_NAMES[id]
  const clean = id.replace(/^building-/, '').replace(/-/g, ' ')
  return clean.replace(/\b\w/g, (c) => c.toUpperCase())
}
