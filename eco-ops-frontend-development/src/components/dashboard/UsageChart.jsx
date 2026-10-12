import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardHeader, AsyncBoundary, EmptyState, Badge } from '../ui'
import { useResource } from '../../hooks/useResource'
import { POLL } from '../../config'
import { RESOURCES, RANGES, buildingName } from '../../lib/constants'
import { fmtDateTime, fmtNumber } from '../../lib/format'

const COLORS = { electricity: '#fbbf24', water: '#38bdf8' }

function ChartTooltip({ active, payload, unit }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs shadow-lg">
      <p className="text-muted">{fmtDateTime(p.timestamp)}</p>
      <p className="mt-1 font-mono text-sm font-semibold text-fg">
        {fmtNumber(p.value)} {unit}
      </p>
      {p.anomaly && <p className="mt-1 font-medium text-danger">Anomaly flagged</p>}
    </div>
  )
}

export function UsageChart({ building, resource, range, onChange, buildings, anomalies }) {
  const swr = useResource('usage', 'getUsage', { building, resource, range }, { refreshInterval: POLL.usage })
  const unit = RESOURCES.find((r) => r.value === resource)?.unit
  const color = COLORS[resource]

  const cleanId = (id) => (id || '').replace(/^building-/, '')
  const anomalyTimes = useMemo(
    () =>
      new Set(
        (anomalies ?? [])
          .filter((a) => cleanId(a.buildingId) === cleanId(building) && a.resource === resource)
          .map((a) => new Date(a.timestamp).getTime()),
      ),
    [anomalies, building, resource],
  )

  const points = useMemo(
    () =>
      (swr.data ?? [])
        .map((r) => ({
          ...r,
          t: new Date(r.timestamp).getTime(),
          anomaly: anomalyTimes.has(new Date(r.timestamp).getTime()) || Boolean(r.isAnomaly),
        }))
        .sort((a, b) => a.t - b.t),
    [swr.data, anomalyTimes],
  )

  const selectClass = 'rounded-lg border border-line bg-bg px-2.5 py-1.5 text-xs text-fg focus:border-primary focus:outline-none'

  return (
    <Card>
      <CardHeader
        title={`${buildingName(building)} · ${RESOURCES.find((r) => r.value === resource)?.label} usage`}
        description={`Hourly readings in ${unit}. Red dots are anomalies flagged by the detection engine.`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="amber">Simulated data</Badge>
            <label className="sr-only" htmlFor="chart-building">Building</label>
            <select id="chart-building" className={selectClass} value={building} onChange={(e) => onChange({ building: e.target.value })}>
              {buildings.map((b) => (
                <option key={b} value={b}>{buildingName(b)}</option>
              ))}
            </select>
            <div className="flex rounded-lg border border-line bg-bg p-0.5" role="group" aria-label="Resource">
              {RESOURCES.map((r) => (
                <button
                  key={r.value}
                  aria-pressed={resource === r.value}
                  onClick={() => onChange({ resource: r.value })}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ${resource === r.value ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <label className="sr-only" htmlFor="chart-range">Range</label>
            <select id="chart-range" className={selectClass} value={range} onChange={(e) => onChange({ range: e.target.value })}>
              {RANGES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        }
      />
      <div className="h-72 px-2 py-4">
        <AsyncBoundary
          swr={swr}
          isEmpty={(d) => d.length === 0}
          empty={<EmptyState title="No readings" description="The backend returned no usage readings for this building and range." />}
          loadingLabel="Loading readings…"
        >
          {() => (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`fill-${resource}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#233430" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="t"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  scale="time"
                  tickFormatter={(t) => new Date(t).toLocaleString('en-IN', range === '24h' ? { hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: 'short' })}
                  stroke="#93a69e"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={32}
                />
                <YAxis stroke="#93a69e" fontSize={11} tickLine={false} axisLine={false} width={44} />
                <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: '#93a69e', strokeDasharray: 3 }} />
                <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#fill-${resource})`} isAnimationActive={false} />
                {points.filter((p) => p.anomaly).map((p) => (
                  <ReferenceDot key={p.t} x={p.t} y={p.value} r={5} fill="#f87171" stroke="#0b1210" strokeWidth={2} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </AsyncBoundary>
      </div>
    </Card>
  )
}
