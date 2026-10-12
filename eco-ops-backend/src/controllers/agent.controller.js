import { AgentRun } from '../models/AgentRun.model.js'
import { AgentLog } from '../models/AgentLog.model.js'
import { runAgent } from '../services/agentService.js'

export async function startAgentRun(req, res) {
  try {
    const { trigger = 'manual', buildingId = null, anomalyId = null, complaintId = null } = req.body || {}

    const agentRun = await runAgent({ trigger, buildingId, anomalyId, complaintId })

    return res.status(202).json({
      success: true,
      message: 'Agent run started',
      data: {
        runId: agentRun.id,
        status: agentRun.status,
      },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export async function getAgentRunById(req, res) {
  try {
    const { id } = req.params
    const run = await AgentRun.findOne({ $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] })
    if (!run) return res.status(404).json({ success: false, message: 'Agent run not found' })
    return res.json({ success: true, data: { run: run.toJSON() } })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export async function getAgentLogs(req, res) {
  try {
    const { limit = 50, runId, cursor } = req.query
    const limitNum = Math.min(100, parseInt(limit, 10) || 50)
    const filter = {}
    if (runId) filter.runId = runId
    if (cursor) filter.timestamp = { $lt: new Date(cursor) }

    const items = await AgentLog.find(filter).sort({ timestamp: -1 }).limit(limitNum + 1)
    const hasMore = items.length > limitNum
    const result = hasMore ? items.slice(0, limitNum) : items
    const nextCursor = hasMore ? result[result.length - 1].timestamp?.toISOString() : null

    return res.json({
      success: true,
      data: {
        items: result.map(l => ({
          id: l.id || l._id.toString(),
          runId: l.runId,
          timestamp: l.timestamp?.toISOString(),
          trigger: l.trigger,
          step: l.step,
          thought: l.thought,
          tool: l.tool,
          result: l.result,
          status: l.status,
        })).reverse(),
        nextCursor,
      },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export async function agentChat(req, res) {
  try {
    const { message } = req.body || {}
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'message is required' })
    }

    const apiKey = process.env.GEMINI_API_KEY
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

    // Gather recent context from the DB
    const [logs, run, tickets, anomalies, approvals] = await Promise.all([
      AgentLog.find().sort({ timestamp: -1 }).limit(10).lean(),
      AgentRun.findOne().sort({ startTime: -1 }).lean(),
      (await import('../models/Ticket.model.js')).Ticket.find({ status: { $ne: 'resolved' } }).limit(6).lean(),
      (await import('../models/Anomaly.model.js')).Anomaly.find({ status: 'open' }).limit(6).lean(),
      (await import('../models/Approval.model.js')).Approval.find({ status: 'pending' }).limit(6).lean(),
    ])

    const formatContext = () => {
      const logLines = logs.map(l => `[Step ${l.step}] ${l.thought} (Tool: ${l.tool}, Result: ${l.result})`).join('\n')
      const ticketLines = tickets.map(t => `- Ticket #${t.id || t._id}: ${t.issue} (${t.location}, priority: ${t.priority})`).join('\n')
      const anomalyLines = anomalies.map(a => `- Anomaly: ${a.reason} in ${a.buildingId} (${a.resource})`).join('\n')
      const approvalLines = approvals.map(a => `- Approval #${a.id || a._id}: ${a.action} (Reason: ${a.reason})`).join('\n')
      return `Recent Activity:\n${logLines || 'None'}\n\nOpen Issues & Tickets:\n${ticketLines || 'None'}\n\nPending Approvals Requiring Action:\n${approvalLines || 'None'}\n\nActive Anomalies:\n${anomalyLines || 'None'}`
    }

    if (!apiKey) {
      const answer = `I'm currently in rule-based mode (GEMINI_API_KEY not configured).\n\n${formatContext()}\n\nQuestion: "${message}"`
      return res.json({ success: true, data: { answer, sourceIds: [], simulated: true } })
    }

    const context = formatContext()
    const prompt = `You are the EcoOps sustainability AI assistant for a smart university campus. Answer the user query clearly and concisely based on the following campus operational data:\n\n${context}\n\nUser Question: ${message}`

    const modelCandidates = [
      process.env.GEMINI_MODEL,
      'gemini-3.5-flash',
      'gemini-3.8-flash',
      'gemini-flash-latest',
    ].filter(Boolean)

    let answer = null
    let lastError = null

    for (const m of modelCandidates) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`
        const gemRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        })

        if (gemRes.ok) {
          const gemData = await gemRes.json()
          answer = gemData?.candidates?.[0]?.content?.parts?.[0]?.text
          if (answer) break
        } else {
          const errData = await gemRes.json().catch(() => ({}))
          lastError = errData?.error?.message || `Gemini API error (${gemRes.status})`
        }
      } catch (e) {
        lastError = e.message
      }
    }

    if (!answer) {
      // Fallback instead of 502 to ensure the UI chat experience never breaks
      answer = `Based on current campus telemetry:\n\n${context}\n\n(Note: Gemini cloud service temporarily unreachable: ${lastError || 'Timeout'})`
    }

    return res.json({
      success: true,
      data: { answer, sourceIds: logs.map(l => l._id?.toString()), simulated: !answer },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
