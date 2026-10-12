import { useState, useMemo } from 'react'
import {
  PlusCircle,
  Activity,
  Zap,
  Droplets,
  CheckCircle,
  AlertTriangle,
  X,
  Sparkles,
  Lightbulb,
  Wrench,
  Radio,
  Clock,
  Building,
  ThermometerSun,
} from 'lucide-react'
import { Button, Card, inputClass, Badge } from '../ui'
import { BUILDING_NAMES, RESOURCES, buildingName } from '../../lib/constants'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'

export function RecordReadingModal({ isOpen, onClose, onRecorded }) {
  const { api, refreshAll } = useApp()
  const toast = useToast()
  const [buildingId, setBuildingId] = useState('building-hostel-b')
  const [resource, setResource] = useState('electricity')
  const [value, setValue] = useState('18.5')
  const [location, setLocation] = useState('Utility Plant / Wing A')
  const [equipment, setEquipment] = useState('HVAC & Central Air')
  const [occupancy, setOccupancy] = useState('Normal - Regular Hours')
  const [timeOfDay, setTimeOfDay] = useState('Daytime Peak (12 PM - 6 PM)')
  const [ambientCondition, setAmbientCondition] = useState('Standard Ambient (26°C)')
  const [submitting, setSubmitting] = useState(false)
  const [dispatchingTicket, setDispatchingTicket] = useState(false)
  const [ticketDispatched, setTicketDispatched] = useState(false)
  const [result, setResult] = useState(null)

  // Live real-time baseline & impact calculation
  const baseline = resource === 'electricity' ? 6.5 : 45.0
  const numValue = parseFloat(value) || 0
  const ratio = baseline > 0 ? numValue / baseline : 1
  const isSpikeExpected = ratio >= 1.6
  const estimatedCost = resource === 'electricity' ? (numValue * 8).toFixed(1) : (numValue * 0.05).toFixed(2)
  const estimatedCo2 = resource === 'electricity' ? (numValue * 0.67).toFixed(2) : (numValue * 0.0003).toFixed(4)

  if (!isOpen) return null

  async function handleSubmit(e) {
    e.preventDefault()
    const val = parseFloat(value)
    if (isNaN(val) || val <= 0) return

    setSubmitting(true)
    setResult(null)
    setTicketDispatched(false)
    try {
      const res = await api.recordUsage({
        buildingId,
        resource,
        value: val,
        location,
        equipment,
        occupancy,
        timeOfDay,
        ambientCondition,
      })
      setResult(res?.data || res)
      toast.success(res?.message || 'Reading recorded and analyzed!')
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
      setValue('29.5')
      setEquipment('Central Chiller Plant')
      setOccupancy('Low - Unoccupied Wing')
      setTimeOfDay('Night / Off-Peak (10 PM - 6 AM)')
      setAmbientCondition('High Heat Load (38°C)')
    } else {
      setValue('185.0')
      setEquipment('Submersible Water Supply Pump')
      setOccupancy('Overnight Vacant')
      setTimeOfDay('Night / Off-Peak (10 PM - 6 AM)')
      setAmbientCondition('Monsoon Overflow')
    }
  }

  function autoScanSensor() {
    // Generates realistic live IoT sensor telemetry packet
    const variations = [
      { val: (baseline * (0.85 + Math.random() * 0.3)).toFixed(1), equip: 'Lighting & Socket Circuits', loc: 'Ground Floor Lobby' },
      { val: (baseline * (1.1 + Math.random() * 0.2)).toFixed(1), equip: 'HVAC & Central Air', loc: '2nd Floor Server Labs' },
      { val: (baseline * (0.95 + Math.random() * 0.15)).toFixed(1), equip: 'Submersible Water Pump', loc: 'North Wing Risers' },
    ]
    const pick = variations[Math.floor(Math.random() * variations.length)]
    setValue(pick.val)
    setEquipment(pick.equip)
    setLocation(pick.loc)
    toast.info('📡 Simulated live IoT packet retrieved from smart meter bus.')
  }

  async function handleQuickDispatchTicket() {
    if (!result?.anomaly) return
    setDispatchingTicket(true)
    try {
      const title = `${resource === 'electricity' ? '⚡ Severe Power Spike' : '💧 Water Surge'} detected at ${buildingName(buildingId)}`
      await api.createTicket({
        anomalyId: result.anomaly.id,
        title,
        description: `${result.anomaly.reason || 'Meter anomaly detected'}.\n\nEquipment: ${equipment} at ${location}.\nOccupancy: ${occupancy}.\n${result.aiDiagnosis || ''}`,
        buildingId,
        location,
        priority: 'high',
        status: 'assigned',
        recommendedAction: result.aiTips?.[0] || 'Inspect telemetry sensor and mechanical valves immediately.',
      })
      toast.success('Work order created and automatically dispatched to campus technicians!')
      setTicketDispatched(true)
      refreshAll()
    } catch (err) {
      toast.error(`Failed to dispatch ticket: ${err.message}`)
    } finally {
      setDispatchingTicket(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
      <Card className="w-full max-w-xl overflow-hidden border-primary/30 shadow-2xl my-6">
        <div className="flex items-center justify-between border-b border-line px-5 py-4 bg-surface-2/40">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30 shadow-xs">
              <Radio className="size-4 animate-pulse" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
                Log Facility Reading & AI Telemetry
                <span className="rounded-full bg-primary/15 text-primary text-[10px] font-mono px-2 py-0.5">
                  Smart IoT Feed
                </span>
              </h3>
              <p className="text-[11px] text-muted">
                Captures deep operational telemetry with instant Gemini AI anomaly diagnosis and energy saving advice.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-fg transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          {/* Quick Action Pills for unique user experience */}
          <div className="flex items-center justify-between rounded-xl bg-surface-2 p-2.5 border border-line text-xs">
            <span className="text-muted text-[11px] font-medium flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              Quick Sensor Actions:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={autoScanSensor}
                className="rounded-lg border border-line bg-bg px-2.5 py-1 text-[11px] font-medium text-fg hover:border-primary/50 transition-colors cursor-pointer"
              >
                📡 Auto-Scan IoT Node
              </button>
              <button
                type="button"
                onClick={simulateSpike}
                className="rounded-lg border border-warn/30 bg-warn/10 px-2.5 py-1 text-[11px] font-semibold text-warn hover:bg-warn/20 transition-colors cursor-pointer"
              >
                ⚡ Trigger Anomaly Spike
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Campus Building</label>
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
              <label className="mb-1 block text-xs font-medium text-muted">Resource Stream</label>
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

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Facility Location / Wing</label>
              <input
                type="text"
                className={inputClass}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. 2nd Floor Labs"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Primary Subsystem</label>
              <select
                className={inputClass}
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
              >
                <option value="HVAC & Central Air">HVAC & Central Air Conditioning</option>
                <option value="Submersible Water Pump">Submersible Hydro-Pneumatic Pump</option>
                <option value="Central Chiller Plant">Central Chiller Plant</option>
                <option value="Hostel Water Geyser">Hostel High-Capacity Water Geyser</option>
                <option value="Server & Lab Equipment">Server & Research Lab Equipment</option>
                <option value="Lighting & Socket Circuits">Lighting & General Socket Circuits</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Occupancy Level</label>
              <select
                className={inputClass}
                value={occupancy}
                onChange={(e) => setOccupancy(e.target.value)}
              >
                <option value="High - Full Capacity">High - Full Capacity</option>
                <option value="Normal - Regular Hours">Normal - Regular</option>
                <option value="Low - Unoccupied Wing">Low - Light Use</option>
                <option value="Overnight Vacant">Overnight Vacant</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Operating Period</label>
              <select
                className={inputClass}
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
              >
                <option value="Daytime Peak (12 PM - 6 PM)">Daytime Peak</option>
                <option value="Morning Startup (6 AM - 12 PM)">Morning Startup</option>
                <option value="Evening Hours (6 PM - 10 PM)">Evening Hours</option>
                <option value="Night / Off-Peak (10 PM - 6 AM)">Night Off-Peak</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Ambient / Weather</label>
              <select
                className={inputClass}
                value={ambientCondition}
                onChange={(e) => setAmbientCondition(e.target.value)}
              >
                <option value="Standard Ambient (26°C)">Standard (26°C)</option>
                <option value="High Heat Load (38°C)">Heatwave (38°C)</option>
                <option value="Rain / High Humidity">High Humidity</option>
                <option value="Cool Night (18°C)">Cool Night (18°C)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted">
                Observed Meter Value ({resource === 'electricity' ? 'kWh' : 'Litres'})
              </label>
              <span className="text-[11px] font-mono text-muted">
                Baseline Reference: ~{baseline} {resource === 'electricity' ? 'kWh' : 'L'}
              </span>
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

          {/* Interactive Live Carbon & Cost Estimator Bar */}
          <div className="rounded-xl border border-line bg-surface-2/60 p-3 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-fg flex items-center gap-1.5">
                <Activity className="size-3.5 text-primary" />
                Live Telemetry Estimator
              </span>
              <span
                className={`font-semibold text-[11px] px-2 py-0.5 rounded-full ${
                  isSpikeExpected
                    ? 'bg-warn/20 text-warn border border-warn/30'
                    : 'bg-primary/20 text-primary border border-primary/30'
                }`}
              >
                {isSpikeExpected ? `Critical Spike (${ratio.toFixed(1)}x baseline)` : `Normal Operating Load (${ratio.toFixed(1)}x)`}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-muted font-mono mt-2 pt-2 border-t border-line/60">
              <div>
                Estimated Cost: <span className="font-bold text-fg">₹{estimatedCost}/hr</span>
              </div>
              <div className="text-right">
                Carbon Rate: <span className="font-bold text-fg">{estimatedCo2} kg CO₂/hr</span>
              </div>
            </div>
          </div>

          {/* AI Submission Analysis Result */}
          {result && (
            <div
              className={`rounded-xl border p-4 text-xs transition-all animate-in fade-in ${
                result.anomaly
                  ? 'border-warn/40 bg-warn/10 text-fg'
                  : 'border-primary/30 bg-primary/10 text-fg'
              }`}
            >
              <div className="flex items-center justify-between font-semibold">
                <div className="flex items-center gap-2">
                  {result.anomaly ? (
                    <>
                      <AlertTriangle className="size-4 text-warn" />
                      <span className="text-warn">Anomaly Spike Flagged by Detection Engine!</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="size-4 text-primary" />
                      <span className="text-primary">Normal Baseline Reading Recorded & Saved</span>
                    </>
                  )}
                </div>
                {result.anomaly && (
                  <Badge tone="red">Severity Score: {result.anomaly.score}/10</Badge>
                )}
              </div>

              {result.anomaly && (
                <p className="mt-2 text-muted leading-relaxed">
                  <strong>Trigger Reason:</strong> {result.anomaly.reason}
                </p>
              )}

              {result.aiDiagnosis && (
                <div className="mt-2.5 rounded-lg border border-primary/30 bg-surface-2 p-2.5 text-primary font-mono text-[11px]">
                  🤖 <strong>AI Autonomous Agent Diagnosis:</strong> {result.aiDiagnosis}
                </div>
              )}

              {/* AI Eco-Tips Card */}
              {result.aiTips && result.aiTips.length > 0 && (
                <div className="mt-3 rounded-lg border border-primary/20 bg-surface-2 p-3 text-fg">
                  <div className="flex items-center gap-1.5 font-semibold text-primary mb-1.5">
                    <Lightbulb className="size-3.5" />
                    AI Eco-Tips & Energy Optimization Recommendations:
                  </div>
                  <ul className="list-disc pl-4 space-y-1.5 text-xs text-fg leading-relaxed">
                    {result.aiTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quick AI Work Order Dispatch Button if Anomaly */}
              {result.anomaly && (
                <div className="mt-3 pt-3 border-t border-warn/20 flex items-center justify-between">
                  <span className="text-[11px] text-muted">
                    {ticketDispatched ? '✅ Work order dispatched to technician queue.' : 'Automate maintenance workflow:'}
                  </span>
                  {!ticketDispatched ? (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleQuickDispatchTicket}
                      loading={dispatchingTicket}
                    >
                      <Wrench className="size-3.5 mr-1" />
                      Dispatch AI Work Order
                    </Button>
                  ) : (
                    <Badge tone="green">Dispatched & In Queue</Badge>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line">
            <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
              Close
            </Button>
            <Button type="submit" loading={submitting}>
              Submit & Run AI Audit
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
