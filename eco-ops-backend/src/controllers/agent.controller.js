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
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash'

    // Gather recent context from the DB
    const [logs, run] = await Promise.all([
      AgentLog.find().sort({ timestamp: -1 }).limit(10).lean(),
      AgentRun.findOne().sort({ startTime: -1 }).lean(),
    ])

    if (!apiKey) {
      const logSummary = logs.map(l => `[${l.tool}] ${l.thought} → ${l.result}`).join('\n')
      const answer = `I'm running in rule-based mode (no Gemini API key configured). Recent agent activity:\n\n${logSummary || 'No recent activity.'}\n\nYour question: "${message}"`
      return res.json({ success: true, data: { answer, sourceIds: [], simulated: true } })
    }

    const context = logs.map(l => `[Step ${l.step}] ${l.thought} (Tool: ${l.tool}, Result: ${l.result})`).join('\n')
    const prompt = `You are the EcoOps sustainability AI assistant. Use the following recent agent activity data to answer the user query truthfully. Do not invent data.\n\nRecent Activity:\n${context || 'No data yet.'}\n\nUser: ${message}`

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const gemRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    })

    if (!gemRes.ok) {
      const errText = await gemRes.text()
      return res.status(502).json({ success: false, message: `Gemini API error (${gemRes.status})` })
    }

    const gemData = await gemRes.json()
    const answer = gemData?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.'

    return res.json({
      success: true,
      data: { answer, sourceIds: logs.map(l => l._id?.toString()), simulated: true },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
