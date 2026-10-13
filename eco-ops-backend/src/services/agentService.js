import { AgentRun } from '../models/AgentRun.model.js'
import { AgentLog } from '../models/AgentLog.model.js'
import { Complaint } from '../models/Complaint.model.js'
import { Anomaly } from '../models/Anomaly.model.js'
import { Ticket } from '../models/Ticket.model.js'
import { Approval } from '../models/Approval.model.js'
import { Notification } from '../models/Notification.model.js'
import { Building } from '../models/Building.model.js'
import { DEFAULT_GEMINI_MODEL } from '../config/constants.js'

async function callGeminiIfAvailable(prompt) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return {
      available: false,
      message: 'GEMINI_API_KEY not configured. Deterministic rules engine used.',
    }
  }

  const modelCandidates = [process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL, 'gemini-3.8-flash', 'gemini-3.5-flash-lite'].filter(Boolean)
  for (const model of modelCandidates) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
        return { available: true, text }
      }
    } catch {
      // try next candidate
    }
  }

  return { available: false, message: 'Gemini request could not complete across model fallbacks.' }
}

export async function runAgent({ trigger = 'manual', complaintId = null, buildingId = null, anomalyId = null } = {}) {
  const runId = `run-${Date.now()}-${Math.floor(Math.random() * 1000)}`

  const agentRun = await AgentRun.create({
    id: runId,
    trigger,
    status: 'running',
    summary: 'Agent investigation started',
    startTime: new Date(),
  })

  let step = 1

  async function addLog(thought, tool, result, status = 'success') {
    const log = await AgentLog.create({
      id: `log-${Date.now()}-${step}-${Math.floor(Math.random() * 1000)}`,
      runId,
      trigger,
      step: step++,
      thought,
      tool,
      result,
      status,
    })
    return log
  }

  try {
    let targetBuildingId = buildingId
    let complaintDoc = null
    let anomalyDoc = null

    // 1. Resolve Complaint if provided or find latest submitted complaint
    if (complaintId) {
      complaintDoc = await Complaint.findOne({
        $or: [{ id: complaintId }, { _id: complaintId.match(/^[0-9a-fA-F]{24}$/) ? complaintId : null }],
      })
      if (complaintDoc) {
        targetBuildingId = complaintDoc.buildingId
      }
    } else {
      complaintDoc = await Complaint.findOne({ status: 'submitted' }).sort({ createdAt: -1 })
      if (complaintDoc) targetBuildingId = complaintDoc.buildingId
    }

    // 2. Resolve Anomaly
    if (anomalyId) {
      anomalyDoc = await Anomaly.findOne({ id: anomalyId })
    } else if (targetBuildingId) {
      anomalyDoc = await Anomaly.findOne({ buildingId: targetBuildingId, status: 'open' }).sort({ timestamp: -1 })
    } else {
      anomalyDoc = await Anomaly.findOne({ status: 'open' }).sort({ timestamp: -1 })
      if (anomalyDoc) targetBuildingId = anomalyDoc.buildingId
    }

    // Fetch building details
    const buildingDoc = targetBuildingId ? await Building.findOne({ id: targetBuildingId }) : null
    const buildingName = buildingDoc ? buildingDoc.name : targetBuildingId || 'Campus Facilities'

    // Step 1: Detect and correlate anomalies
    await addLog(
      `Checking telemetry and sensor anomaly feeds for ${buildingName}...`,
      'detect_anomalies',
      anomalyDoc
        ? `Found active anomaly: ${anomalyDoc.reason} (score: ${anomalyDoc.score})`
        : `No active anomalous spikes detected in baseline readings for ${buildingName}.`
    )

    // Step 2: Prevent duplicate open tickets
    const issueSummary = complaintDoc
      ? `${complaintDoc.type.replace(/_/g, ' ').toUpperCase()}: ${complaintDoc.description}`
      : anomalyDoc
      ? anomalyDoc.reason
      : 'Routine automated facility inspection'

    const locationText = complaintDoc?.location || 'Main Utility Wing'

    const existingTicket = await Ticket.findOne({
      buildingId: targetBuildingId || 'building-hostel-b',
      status: { $in: ['open', 'assigned', 'in_progress'] },
      $or: [
        { complaintId: complaintDoc?.id || complaintDoc?._id?.toString() },
        { location: locationText },
      ],
    })

    if (existingTicket) {
      await addLog(
        `Checking open maintenance records for location '${locationText}' to avoid duplicate work.`,
        'get_open_tickets',
        `Duplicate open ticket #${existingTicket.id} found. Skipping redundant ticket creation.`
      )

      agentRun.status = 'completed'
      agentRun.summary = `Correlated issue with existing ticket #${existingTicket.id}. No duplicate created.`
      agentRun.endTime = new Date()
      await agentRun.save()
      return agentRun
    }

    await addLog(
      `No duplicate active tickets found for location '${locationText}'. Proceeding with triage.`,
      'get_open_tickets',
      '0 active tickets found.'
    )

    // Step 3: Determine severity and check if high-impact approval is required
    let priority = 'medium'
    const isWater = complaintDoc?.type === 'water_leak' || anomalyDoc?.resource === 'water'
    const isHighImpact = (anomalyDoc && anomalyDoc.score >= 2.8) || (isWater && anomalyDoc?.observedValue > 2000)

    if (isHighImpact) {
      priority = 'high'
    }

    let team = 'facilities'
    if (isWater) team = 'plumbing'
    else if (complaintDoc?.type === 'lights_ac_left_on' || anomalyDoc?.resource === 'electricity') team = 'electrical'
    else if (complaintDoc?.type === 'waste') team = 'housekeeping'

    // Step 4: Optional LLM diagnostic call
    const llmPrompt = `You are an automated campus sustainability AI. Provide a 1-sentence diagnostic root cause for ${issueSummary} in ${buildingName} (${locationText}).`
    const llmResult = await callGeminiIfAvailable(llmPrompt)

    let diagnosticCause = anomalyDoc
      ? `Telemetry anomaly verified: ${anomalyDoc.reason}`
      : 'Reported by campus user; verified against facility rules'

    if (llmResult.available && llmResult.text) {
      diagnosticCause = `${llmResult.text.trim()} (${diagnosticCause})`
    }

    // Step 5: Create Ticket
    const ticketId = `ticket-${Date.now()}`
    const ticket = await Ticket.create({
      id: ticketId,
      complaintId: complaintDoc?.id || complaintDoc?._id?.toString() || null,
      buildingId: targetBuildingId || 'building-hostel-b',
      location: locationText,
      issue: complaintDoc ? complaintDoc.description : anomalyDoc?.reason || 'Facility inspection',
      priority,
      cause: diagnosticCause,
      recommendedAction: isWater
        ? 'Inspect pipe joints and repair leaking valve'
        : 'Recalibrate HVAC and power down unattended circuits',
      assignee: {
        team,
        userId: 'demo-staff',
        name: 'Facilities Staff',
      },
      status: 'assigned',
    })

    if (complaintDoc) {
      complaintDoc.status = 'in_review'
      await complaintDoc.save()
    }

    if (anomalyDoc) {
      anomalyDoc.status = 'linked'
      await anomalyDoc.save()
    }

    await addLog(
      `Triaged issue and dispatched maintenance ticket with priority '${priority}' to ${team} team.`,
      'create_ticket',
      `Ticket #${ticketId} created successfully.`
    )

    // Step 6: If High Impact, create Approval
    if (isHighImpact) {
      const approvalId = `appr-${Date.now()}`
      await Approval.create({
        id: approvalId,
        ticketId,
        action: `Authorize high-priority emergency repair for ${issueSummary}`,
        reason: `High resource wastage threshold detected (${anomalyDoc?.observedValue || 'surge'} units)`,
        status: 'pending',
        requestedAt: new Date(),
      })

      await addLog(
        `High resource loss threshold reached. Pausing auto-execution to request human approval.`,
        'request_approval',
        `Approval request #${approvalId} queued for Sustainability Administrator.`
      )

      await Notification.create({
        id: `notif-${Date.now()}-adm`,
        to: 'demo-admin',
        message: `High-impact action requires approval: ${issueSummary} in ${buildingName}`,
        type: 'approval_needed',
      })
    }

    // Step 7: Send Notification to Staff
    await Notification.create({
      id: `notif-${Date.now()}-stf`,
      to: 'demo-staff',
      message: `New ${priority}-priority ${team} ticket #${ticketId} assigned: ${locationText}`,
      type: 'ticket_assigned',
    })

    await addLog(
      `Notified assigned staff technician for prompt remediation.`,
      'send_notification',
      `Sent notification to ${team} technician (demo-staff).`
    )

    agentRun.status = 'completed'
    agentRun.summary = `Investigated ${buildingName}, correlated telemetry, created ticket #${ticketId}, and assigned ${team} team.`
    agentRun.endTime = new Date()
    await agentRun.save()

    return agentRun
  } catch (err) {
    console.error('[Agent] Run failed:', err)
    agentRun.status = 'failed'
    agentRun.summary = `Agent run encountered error: ${err.message}`
    agentRun.endTime = new Date()
    await agentRun.save()
    throw err
  }
}
