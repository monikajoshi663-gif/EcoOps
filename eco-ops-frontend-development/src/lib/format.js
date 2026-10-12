const numberFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 })
const intFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

export const fmtNumber = (n) => (Number.isFinite(Number(n)) ? numberFmt.format(Number(n)) : '—')
export const fmtInt = (n) => (Number.isFinite(Number(n)) ? intFmt.format(Number(n)) : '—')
export const fmtRupees = (n) => (Number.isFinite(Number(n)) ? `₹${intFmt.format(Number(n))}` : '—')

export function fmtTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function fmtDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function fmtRelative(value) {
  if (!value) return ''
  const diff = Date.now() - new Date(value).getTime()
  if (!Number.isFinite(diff)) return ''
  const s = Math.round(diff / 1000)
  if (s < 60) return `${Math.max(s, 0)}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

export function stringify(value) {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}
