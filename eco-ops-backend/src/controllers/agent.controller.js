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
    const { message, history = [] } = req.body || {}
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'message is required' })
    }

    const apiKey = process.env.GEMINI_API_KEY
    const cleanBuildingName = (id = '') => {
      const clean = id.replace(/^building-/, '').replace(/-/g, ' ')
      return clean.replace(/\b\w/g, (c) => c.toUpperCase()) || 'Campus Facility'
    }

    // Gather live operational telemetry from MongoDB
    const [tickets, anomalies, approvals] = await Promise.all([
      (await import('../models/Ticket.model.js')).Ticket.find({ status: { $ne: 'resolved' } }).limit(8).lean().catch(() => []),
      (await import('../models/Anomaly.model.js')).Anomaly.find({ status: 'open' }).limit(8).lean().catch(() => []),
      (await import('../models/Approval.model.js')).Approval.find({ status: 'pending' }).limit(5).lean().catch(() => []),
    ])

    const anomaliesSummary = anomalies.length > 0 
      ? anomalies.map(a => `${cleanBuildingName(a.buildingId)} (${a.resource}): ${a.reason} [Observed: ${a.observedValue || a.value || 'N/A'}, Baseline: ${a.baselineValue || a.expectedBaseline || 'N/A'}]`).join('\n')
      : 'All campus zones operating within normal baseline limits.'

    const ticketsSummary = tickets.length > 0
      ? tickets.map(t => `#${t.id || t._id}: ${t.issue || t.title} at ${t.location} (Status: ${t.status}, Priority: ${t.priority})`).join('\n')
      : 'No active maintenance tickets.'

    const systemPrompt = `You are EcoOps AI, a friendly, highly intelligent, conversational AI assistant for campus sustainability and IoT facilities (similar to ChatGPT, but with specialized awareness of the campus).

Key behaviors:
1. Talk naturally, conversationally, warmly, and helpfully. Do NOT follow rigid pre-scripted formats, robotic headers, or static templates.
2. If the user greets you, asks how you are, makes small talk, or asks general questions, chat with them naturally, just like ChatGPT would.
3. If the user asks about campus energy, water, sustainability, tickets, anomalies, or maintenance, seamlessly incorporate the live campus data below into your conversation.
4. When formatting explanations or reports, use clean, readable Markdown (bullet points, bold text) without being overly rigid or repetitive.

Live Campus Context:
- Active Anomalies:
${anomaliesSummary}
- Active Work Orders / Tickets:
${ticketsSummary}
- Pending Approvals: ${approvals.length}`

    let answer = null

    if (apiKey) {
      const modelsToTry = [
        process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemma-4-26b-a4b-it',
      ]

      // Build conversation contents including past messages
      const contents = []
      if (Array.isArray(history) && history.length > 0) {
        for (const item of history.slice(-6)) {
          if (item.text) {
            contents.push({
              role: item.role === 'user' ? 'user' : 'model',
              parts: [{ text: item.text }]
            })
          }
        }
      }
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      })

      const requestBody = {
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents,
      }

      for (const model of modelsToTry) {
        try {
          const gemRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(9000),
          })

          if (gemRes.ok) {
            const gemData = await gemRes.json()
            const text = gemData?.candidates?.[0]?.content?.parts?.[0]?.text
            if (text && text.trim()) {
              answer = text.trim()
              break
            }
          }
        } catch (_) {
          // Fall through to next model
        }
      }
    }

    // Conversational fallback if external API is unreachable
    if (!answer) {
      const q = message.toLowerCase()
      if (/^(hi|hello|hey|greetings|howdy)\b/.test(q)) {
        answer = `Hello! I'm your EcoOps AI assistant. I'm here to chat, answer questions, and help monitor our campus energy, water usage, and sustainability operations. What's on your mind today?`
      } else if (q.includes('who are you') || q.includes('what can you do')) {
        answer = `I'm EcoOps AI — think of me as your campus sustainability co-pilot! I can chat with you about energy conservation, look up live telemetry anomalies, track maintenance work orders, or analyze sustainability metrics. How can I help?`
      } else {
        answer = `I analyzed your request regarding "${message}". Based on our live campus telemetry, we currently have ${anomalies.length} open anomal${anomalies.length === 1 ? 'y' : 'ies'} and ${tickets.length} active work order${tickets.length === 1 ? '' : 's'}. Feel free to ask more specific questions about any building, leak, or sustainability measure!`
      }
    }

    return res.json({
      success: true,
      data: { answer, simulated: false },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
