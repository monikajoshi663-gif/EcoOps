import { useState } from 'react'
import { PlusCircle, Activity, Zap, Droplets, CheckCircle, AlertTriangle, X } from 'lucide-react'
import { Button, Card, inputClass, Badge } from '../ui'
import { BUILDING_NAMES, RESOURCES } from '../../lib/constants'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'

export function RecordReadingModal({ isOpen, onClose, onRecorded }) {
  const { api, refreshAll } = useApp()
  const toast = useToast()
  const [buildingId, setBuildingId] = useState('building-hostel-b')
  const [resource, setResource] = useState('electricity')
  const [value, setValue] = useState('18.5')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  if (!isOpen) return null

  async function handleSubmit(e) {
    e.preventDefault()
    const val = parseFloat(value)
    if (isNaN(val) || val <= 0) return

    setSubmitting(true)
    setResult(null)
    try {
      const res = await api.recordUsage({
        buildingId,
        resource,
        value: val,
      })
      setResult(res?.data || res)
      toast.success(res?.message || 'Reading recorded successfully!')
      refreshAll()
      onRecorded?.()
    } catch (err) {
      toast.error(`Failed to record reading: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  function simulateSpike() {
    if (resource === 'electricity') {
      setValue('28.5') // Significant spike over baseline ~6.5 kWh
    } else {
      setValue('185.0') // Significant spike over baseline ~45 L
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <Card className="w-full max-w-lg overflow-hidden border-primary/30 shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <PlusCircle className="size-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-fg">Log Meter Reading & AI Telemetry</h3>
              <p className="text-[11px] text-muted">Submit IoT sensor reading to trigger real-time AI anomaly detection.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-surface hover:text-fg transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Building</label>
              <select
                className={inputClass}
                value={buildingId}
                onChange={(e) => setBuildingId(e.target.value)}
              >
                {Object.entries(BUILDING_NAMES)
                  .filter(([id]) => id.startsWith('building-'))
                  .map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Resource Type</label>
              <select
                className={inputClass}
                value={resource}
                onChange={(e) => {
                  setResource(e.target.value)
                  setValue(e.target.value === 'electricity' ? '12.0' : '55.0')
                }}
              >
                {RESOURCES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label} ({r.unit})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted">
                Observed Value ({resource === 'electricity' ? 'kWh' : 'Litres'})
              </label>
              <button
                type="button"
                onClick={simulateSpike}
                className="text-[11px] font-semibold text-warn hover:underline flex items-center gap-1 cursor-pointer"
              >
                ⚡ Simulate Anomaly Spike
              </button>
            </div>
            <input
              type="number"
              step="0.1"
              min="0"
              required
              className={inputClass}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 24.5"
            />
          </div>

          {result && (
            <div
              className={`rounded-xl border p-3.5 text-xs ${
                result.anomaly
                  ? 'border-warn/40 bg-warn/10 text-fg'
                  : 'border-primary/30 bg-primary/10 text-fg'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {result.anomaly ? (
                  <>
                    <AlertTriangle className="size-4 text-warn" />
                    <span className="text-warn">Anomaly Spike Flagged by AI Engine!</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="size-4 text-primary" />
                    <span className="text-primary">Normal Baseline Reading</span>
                  </>
                )}
              </div>
              {result.anomaly && (
                <p className="mt-1.5 text-muted leading-relaxed">
                  <strong>Trigger:</strong> {result.anomaly.reason}
                </p>
              )}
              {result.aiDiagnosis && (
                <p className="mt-1 text-primary leading-relaxed font-mono text-[11px]">
                  🤖 {result.aiDiagnosis}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line">
            <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
              Close
            </Button>
            <Button type="submit" loading={submitting}>
              Submit & Analyze
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
