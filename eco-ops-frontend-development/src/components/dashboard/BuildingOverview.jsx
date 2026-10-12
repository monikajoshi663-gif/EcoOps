import { useMemo } from 'react'
import { AlertTriangle, Droplets, Zap } from 'lucide-react'
import { Card, CardHeader, AsyncBoundary, EmptyState, Badge } from '../ui'
import { buildingName } from '../../lib/constants'
import { fmtInt } from '../../lib/format'

export function BuildingOverview({ usageSwr, anomalies, selected, onSelect }) {
  const rows = useMemo(() => {
    const map = new Map()
    for (const r of usageSwr.data ?? []) {
      const row = map.get(r.buildingId) ?? { buildingId: r.buildingId, electricity: 0, water: 0 }
      row[r.resource] = (row[r.resource] ?? 0) + Number(r.value || 0)
      map.set(r.buildingId, row)
    }
    return [...map.values()].map((row) => ({
      ...row,
      anomalies: (anomalies ?? []).filter((a) => a.buildingId === row.buildingId).length,
    }))
  }, [usageSwr.data, anomalies])

  return (
    <Card>
      <CardHeader title="Building overview" description="Last 24 hours. Select a building to chart it." action={<Badge tone="amber">Simulated</Badge>} />
      <AsyncBoundary
        swr={usageSwr}
        isEmpty={() => rows.length === 0}
        empty={<EmptyState title="No buildings" description="No usage readings returned yet." />}
        loadingLabel="Loading buildings…"
      >
        {() => (
          <ul className="divide-y divide-line">
            {rows.map((row) => (
              <li key={row.buildingId}>
                <button
                  onClick={() => onSelect(row.buildingId)}
                  aria-pressed={selected === row.buildingId}
                  className={`flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-2 ${selected === row.buildingId ? 'bg-surface-2' : ''}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-fg">{buildingName(row.buildingId)}</span>
                    <span className="mt-1 flex items-center gap-3 font-mono text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Zap className="size-3 text-warn" aria-hidden />
                        {fmtInt(row.electricity)} kWh
                      </span>
                      <span className="flex items-center gap-1">
                        <Droplets className="size-3 text-water" aria-hidden />
                        {fmtInt(row.water)} L
                      </span>
                    </span>
                  </span>
                  {row.anomalies > 0 ? (
                    <Badge tone="red">
                      <AlertTriangle className="size-3" aria-hidden />
                      {row.anomalies}
                      <span className="sr-only"> anomalies</span>
                    </Badge>
                  ) : (
                    <Badge tone="green">Normal</Badge>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </AsyncBoundary>
    </Card>
  )
}
