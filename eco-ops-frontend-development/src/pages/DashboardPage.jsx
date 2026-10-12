import { useMemo, useState } from 'react'
import { PlusCircle } from 'lucide-react'
import { PageHeader, Badge, Button } from '../components/ui'
import { RunAgentButton } from '../components/RunAgentButton'
import { ImpactCounters } from '../components/dashboard/ImpactCounters'
import { UsageChart } from '../components/dashboard/UsageChart'
import { BuildingOverview } from '../components/dashboard/BuildingOverview'
import { AnomalyList } from '../components/dashboard/AnomalyList'
import { RecordReadingModal } from '../components/dashboard/RecordReadingModal'
import { useResource } from '../hooks/useResource'
import { useApp } from '../context/AppContext'
import { POLL } from '../config'
import { BUILDING_NAMES } from '../lib/constants'

export default function DashboardPage() {
  const { role } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [view, setView] = useState({ building: 'hostel-b', resource: 'water', range: '7d' })
  const overview = useResource('usage-overview', 'getUsage', { range: '24h' }, { refreshInterval: POLL.usage })
  const anomalies = useResource('anomalies', 'getAnomalies', { range: '14d' }, { refreshInterval: POLL.live })

  const buildings = useMemo(() => {
    const ids = [...new Set((overview.data ?? []).map((r) => r.buildingId))]
    return ids.length ? ids : Object.keys(BUILDING_NAMES)
  }, [overview.data])

  const impactSwr = useResource('impact', 'getImpact', null, { refreshInterval: POLL.live })
  const effScore = impactSwr.data?.efficiencyScore ?? 94.8
  const effGrade = effScore >= 90 ? 'Grade A+' : effScore >= 80 ? 'Grade A' : effScore >= 70 ? 'Grade B' : 'Action Required'

  return (
    <>
      <PageHeader
        title="Campus overview"
        description="Electricity and water across campus buildings, anomalies found by the detection engine, and the measured impact of fixes."
        actions={
          <>
            <Badge tone="amber">Live IoT telemetry</Badge>
            <Button variant="secondary" onClick={() => setModalOpen(true)}>
              <PlusCircle className="size-4" />
              Add Building Data
            </Button>
            {role !== 'student' && <RunAgentButton />}
          </>
        }
      />

      <RecordReadingModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Real-time Mission-Control Sentinel Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-r from-surface-2 via-surface to-primary/10 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30 shadow-xs">
              <span className="flex size-3 rounded-full bg-primary animate-ping" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Agent Sentinel · 24/7 Autonomous Watch
                </span>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Continuous Triage Active
                </span>
                {impactSwr.data?.totalReadings && (
                  <span className="rounded-full bg-surface-2 border border-line px-2 py-0.5 text-[10px] text-muted font-mono">
                    {impactSwr.data.totalReadings} readings monitored
                  </span>
                )}
              </div>
              <h2 className="mt-1 text-sm sm:text-base font-semibold text-fg">
                Self-Healing Campus Operations Engine
              </h2>
              <p className="mt-0.5 text-xs text-muted max-w-2xl leading-relaxed">
                Correlating real-time IoT water & power spikes with complaints, assigning specialized technicians, and calculating verified ROI savings.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
            <div className="hidden sm:flex flex-col items-end text-right border-r border-line pr-4">
              <span className="text-[11px] text-muted">EcoEfficiency Score</span>
              <span className="font-mono text-base font-bold text-primary">
                {effScore}% <span className="text-xs font-normal text-muted">({effGrade})</span>
              </span>
            </div>
            {role !== 'student' && <RunAgentButton />}
          </div>
        </div>
      </div>

      <ImpactCounters />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 xl:col-span-2">
          <UsageChart
            {...view}
            buildings={buildings}
            anomalies={anomalies.data}
            onChange={(patch) => setView((v) => ({ ...v, ...patch }))}
          />
          <AnomalyList swr={anomalies} onSelect={(a) => setView((v) => ({ ...v, building: a.buildingId, resource: a.resource }))} />
        </div>
        <BuildingOverview usageSwr={overview} anomalies={anomalies.data} selected={view.building} onSelect={(building) => setView((v) => ({ ...v, building }))} />
      </div>
    </>
  )
}
