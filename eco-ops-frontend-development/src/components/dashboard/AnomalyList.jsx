import { Droplets, Zap } from 'lucide-react'
import { Card, CardHeader, AsyncBoundary, EmptyState, Badge } from '../ui'
import { buildingName } from '../../lib/constants'
import { fmtDateTime, fmtNumber } from '../../lib/format'

export function AnomalyList({ swr, onSelect }) {
  return (
    <Card>
      <CardHeader title="Detected anomalies" description="Rolling baseline per building and hour, flagged by z-score." />
      <AsyncBoundary
        swr={swr}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState title="No anomalies" description="Usage is within the expected baseline." />}
        loadingLabel="Loading anomalies…"
      >
        {(anomalies) => (
          <ul className="divide-y divide-line">
            {anomalies.slice(0, 6).map((a) => {
              const Icon = a.resource === 'water' ? Droplets : Zap
              const ratio = a.baseline ? a.value / a.baseline : null
              return (
                <li key={a.id ?? `${a.buildingId}-${a.timestamp}`}>
                  <button onClick={() => onSelect(a)} className="flex w-full gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-2">
                    <span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md ${a.resource === 'water' ? 'bg-water/10 text-water' : 'bg-warn/10 text-warn'}`}>
                      <Icon className="size-3.5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-fg">{buildingName(a.buildingId)}</span>
                        {ratio && <Badge tone="red">{fmtNumber(ratio)}x baseline</Badge>}
                        {a.zScore && <span className="font-mono text-[11px] text-muted">z={fmtNumber(a.zScore)}</span>}
                      </span>
                      {a.description && <span className="mt-1 block text-pretty text-xs leading-relaxed text-muted">{a.description}</span>}
                      <span className="mt-1 block text-[11px] text-muted">{fmtDateTime(a.timestamp)}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </AsyncBoundary>
    </Card>
  )
}
