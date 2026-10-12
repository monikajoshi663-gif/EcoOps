import { useMemo, useState } from 'react'
import { PageHeader, Badge } from '../components/ui'
import { RunAgentButton } from '../components/RunAgentButton'
import { ImpactCounters } from '../components/dashboard/ImpactCounters'
import { UsageChart } from '../components/dashboard/UsageChart'
import { BuildingOverview } from '../components/dashboard/BuildingOverview'
import { AnomalyList } from '../components/dashboard/AnomalyList'
import { useResource } from '../hooks/useResource'
import { useApp } from '../context/AppContext'
import { POLL } from '../config'
import { BUILDING_NAMES } from '../lib/constants'

export default function DashboardPage() {
  const { role } = useApp()
  const [view, setView] = useState({ building: 'hostel-b', resource: 'water', range: '7d' })
  const overview = useResource('usage-overview', 'getUsage', { range: '24h' }, { refreshInterval: POLL.usage })
  const anomalies = useResource('anomalies', 'getAnomalies', { range: '14d' }, { refreshInterval: POLL.live })

  const buildings = useMemo(() => {
    const ids = [...new Set((overview.data ?? []).map((r) => r.buildingId))]
    return ids.length ? ids : Object.keys(BUILDING_NAMES)
  }, [overview.data])

  return (
    <>
      <PageHeader
        title="Campus overview"
        description="Electricity and water across five buildings, anomalies found by the detection engine, and the measured impact of fixes."
        actions={
          <>
            <Badge tone="amber">Simulated meter data</Badge>
            {role !== 'student' && <RunAgentButton />}
          </>
        }
      />

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
