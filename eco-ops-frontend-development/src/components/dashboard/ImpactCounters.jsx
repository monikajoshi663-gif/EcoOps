import { Droplets, IndianRupee, Leaf, Zap } from 'lucide-react'
import { useResource } from '../../hooks/useResource'
import { POLL } from '../../config'
import { Card, ErrorState } from '../ui'
import { fmtInt, fmtNumber } from '../../lib/format'

const METRICS = [
  { key: 'kwhSaved', label: 'Electricity saved', unit: 'kWh', icon: Zap, color: 'text-warn', format: fmtInt },
  { key: 'litresSaved', label: 'Water saved', unit: 'litres', icon: Droplets, color: 'text-water', format: fmtInt },
  { key: 'rupeesSaved', label: 'Cost saved', unit: 'INR', icon: IndianRupee, color: 'text-primary', format: fmtInt },
  { key: 'co2Saved', label: <>CO<sub>2</sub> avoided</>, unit: 'kg', icon: Leaf, color: 'text-primary', format: fmtNumber },
]

export function ImpactCounters() {
  const swr = useResource('impact', 'getImpact', null, { refreshInterval: POLL.live })
  const impact = swr.data
  const a = impact?.assumptions

  if (swr.error && !impact) {
    return (
      <Card>
        <ErrorState error={swr.error} onRetry={swr.mutate} />
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {METRICS.map((m) => {
          const Icon = m.icon
          return (
            <Card key={m.key} className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted">{m.label}</p>
                <Icon className={`size-4 ${m.color}`} aria-hidden />
              </div>
              <p className="font-mono text-2xl font-semibold tracking-tight text-fg md:text-3xl">
                {impact ? m.format(impact[m.key]) : <span className="inline-block h-8 w-20 animate-pulse rounded bg-surface-2" />}
              </p>
              <p className="text-[11px] text-muted">{m.unit} · estimated</p>
            </Card>
          )
        })}
      </div>
      <p className="text-[11px] leading-relaxed text-muted">
        Estimated impact from resolved issues
        {impact && Number.isFinite(impact.issuesResolved) && ` (${impact.issuesResolved} resolved of ${impact.issuesDetected ?? '—'} detected)`}.{' '}
        {a ? (
          <>
            {`Assumptions: ₹${a.tariffPerKwh}/kWh, ₹${a.tariffPerLitre}/L, ${a.co2PerKwh} kg CO`}
            <sub>2</sub>
            {'/kWh grid factor.'}
          </>
        ) : (
          'Tariff and emission-factor assumptions are set by the backend.'
        )}
      </p>
    </div>
  )
}
