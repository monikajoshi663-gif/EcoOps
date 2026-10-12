import { useMemo } from 'react'
import { Bot, Eye, Wrench } from 'lucide-react'
import { Card, PageHeader, AsyncBoundary, EmptyState, Badge } from '../components/ui'
import { RunAgentButton } from '../components/RunAgentButton'
import { useResource } from '../hooks/useResource'
import { POLL } from '../config'
import { fmtTime, fmtRelative, stringify } from '../lib/format'

const TRIGGER_TONE = { complaint: 'blue', anomaly: 'red', manual: 'green', approval: 'amber', ticket_resolved: 'green' }

export default function ActivityPage() {
  const swr = useResource('logs', 'getAgentLogs', null, { refreshInterval: POLL.logs })
  const logs = useMemo(() => [...(swr.data ?? [])].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)), [swr.data])

  return (
    <>
      <PageHeader
        title="Agent activity"
        description="Everything the agent observed, decided, and did, with its reasoning and tool calls."
        actions={
          <>
            <span className="flex items-center gap-2 text-xs text-muted">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              Live · refreshes every {POLL.logs / 1000}s
            </span>
            <RunAgentButton />
          </>
        }
      />
      <Card>
        <AsyncBoundary swr={{ ...swr, data: swr.data && logs }} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No agent activity yet" description="Run the agent or submit a complaint to see its steps here." />}>
          {(entries) => (
            <ol className="divide-y divide-line">
              {entries.map((log, i) => (
                <li key={log.id ?? i} className="flex gap-4 px-5 py-4">
                  <div className="flex flex-col items-center">
                    <span className={`flex size-8 items-center justify-center rounded-full border ${log.tool ? 'border-primary/30 bg-primary/10 text-primary' : 'border-line bg-surface-2 text-muted'}`}>
                      {log.tool ? <Wrench className="size-3.5" aria-hidden /> : log.step === 1 ? <Eye className="size-3.5" aria-hidden /> : <Bot className="size-3.5" aria-hidden />}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <time dateTime={log.timestamp} className="font-mono text-xs text-fg">{fmtTime(log.timestamp)}</time>
                      <span className="text-[11px] text-muted">{fmtRelative(log.timestamp)}</span>
                      {log.trigger && <Badge tone={TRIGGER_TONE[log.trigger] ?? 'neutral'} className="capitalize">{String(log.trigger).replace(/_/g, ' ')}</Badge>}
                      {log.step != null && <span className="text-[11px] text-muted">Step {log.step}</span>}
                    </div>
                    {log.thought && <p className="mt-1.5 text-pretty text-sm leading-relaxed text-fg">{log.thought}</p>}
                    {log.tool && (
                      <div className="mt-2 overflow-hidden rounded-lg border border-line bg-bg">
                        <p className="border-b border-line px-3 py-1.5 font-mono text-xs text-primary">{log.tool}()</p>
                        {log.result != null && (
                          <pre className="max-h-40 overflow-auto px-3 py-2 font-mono text-[11px] leading-relaxed text-muted">{stringify(log.result)}</pre>
                        )}
                      </div>
                    )}
                    {!log.tool && log.result != null && <pre className="mt-2 overflow-auto font-mono text-[11px] text-muted">{stringify(log.result)}</pre>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </AsyncBoundary>
      </Card>
    </>
  )
}
