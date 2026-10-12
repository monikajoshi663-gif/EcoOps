import { Reading } from '../models/Reading.model.js'
import { seedDatabase } from '../services/seedService.js'

export async function getUsage(req, res) {
  try {
    const { building, buildingId, resource, from, to, range, limit } = req.query
    const targetBuilding = buildingId || building

    const filter = { simulated: true }
    if (targetBuilding && targetBuilding !== 'all') {
      const cleanId = targetBuilding.replace(/^building-/, '')
      filter.$or = [
        { buildingId: targetBuilding },
        { buildingId: `building-${cleanId}` },
        { buildingId: cleanId },
      ]
    }
    if (resource && (resource === 'electricity' || resource === 'water')) {
      filter.resource = resource
    }

    if (from || to) {
      filter.timestamp = {}
      if (from) filter.timestamp.$gte = new Date(from)
      if (to) filter.timestamp.$lte = new Date(to)
    } else if (range) {
      const hoursMap = { '24h': 24, '7d': 168, '14d': 336, '30d': 720 }
      const hours = hoursMap[range] || 168
      // Find the most recent reading timestamp to anchor relative time ranges
      const latestReading = await Reading.findOne().sort({ timestamp: -1 }).select('timestamp').lean()
      const anchorDate = latestReading?.timestamp ? new Date(latestReading.timestamp) : new Date()
      const sinceDate = new Date(anchorDate.getTime() - hours * 60 * 60 * 1000)
      filter.timestamp = { $gte: sinceDate, $lte: anchorDate }
    }

    const maxLimit = limit ? Math.min(parseInt(limit, 10), 5000) : 3000
    const readings = await Reading.find(filter)
      .sort({ timestamp: 1 })
      .limit(maxLimit)
      .lean()

    const series = readings.map((r) => ({
      id: r._id.toString(),
      buildingId: r.buildingId,
      buildingName: r.buildingName,
      resource: r.resource,
      timestamp: r.timestamp.toISOString(),
      value: r.value,
      baseline: r.baseline,
      isAnomaly: r.isAnomaly,
    }))

    return res.status(200).json({
      success: true,
      data: {
        simulated: true,
        unitByResource: {
          electricity: 'kWh',
          water: 'litres',
        },
        series,
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export async function generateUsage(req, res) {
  try {
    const result = await seedDatabase({ force: true })
    return res.status(200).json({
      success: true,
      message: 'Demo usage data generated',
      data: result,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export async function recordUsage(req, res) {
  try {
    const { buildingId, building, resource, value, timestamp, location, equipment, occupancy, timeOfDay } = req.body || {}
    const targetBuilding = buildingId || building
    if (!targetBuilding || !resource || value === undefined) {
      return res.status(400).json({ success: false, message: 'buildingId, resource, and value are required.' })
    }

    const val = Number(value)
    if (isNaN(val) || val < 0) {
      return res.status(400).json({ success: false, message: 'value must be a valid positive number.' })
    }

    const bId = targetBuilding.startsWith('building-') ? targetBuilding : `building-${targetBuilding}`
    
    // Find recent readings to compute dynamic baseline
    const lastReading = await Reading.findOne({ buildingId: bId, resource }).sort({ timestamp: -1 })
    const baseline = lastReading?.baseline || (resource === 'electricity' ? 6.5 : 45.0)

    const ratio = baseline > 0 ? val / baseline : 1
    const isAnomaly = ratio >= 1.6 // 60% or higher above baseline
    const readingTime = timestamp ? new Date(timestamp) : new Date()

    const resolvedBuildingName = lastReading?.buildingName || (targetBuilding.replace(/^building-/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))

    const reading = await Reading.create({
      buildingId: bId,
      buildingName: resolvedBuildingName,
      resource,
      value: val,
      baseline,
      isAnomaly,
      timestamp: readingTime,
      simulated: true,
    })

    let anomalyDoc = null
    let aiDiagnosis = null

    if (isAnomaly) {
      const anomalyId = `anom-${Date.now()}`
      const reason = `${resource.toUpperCase()} spike: ${ratio.toFixed(1)}x expected baseline (${val} ${resource === 'electricity' ? 'kWh' : 'L'})`
      
      anomalyDoc = await (await import('../models/Anomaly.model.js')).Anomaly.create({
        id: anomalyId,
        buildingId: bId,
        buildingName: resolvedBuildingName,
        resource,
        timestamp: readingTime,
        observedValue: val,
        baselineValue: baseline,
        score: Math.min(10, Math.round(ratio * 3 * 10) / 10),
        reason,
        status: 'open',
      })

      // Run autonomous AI agent to correlate and triage
      try {
        const { runAgent } = await import('../services/agentService.js')
        const agentRun = await runAgent({ trigger: 'anomaly', anomalyId, buildingId: bId })
        aiDiagnosis = `AI Agent analyzed spike: ${agentRun.summary}`
      } catch (agentErr) {
        aiDiagnosis = `Spike flagged. Scheduled for automated agent triage.`
      }
    }

    // Call Gemini for instant intelligent Eco-Tips & Energy Optimization Advice
    let aiTips = [
      resource === 'electricity'
        ? `Shift non-essential loads at ${resolvedBuildingName} to off-peak hours (10 PM - 6 AM) to reduce demand charges.`
        : `Inspect pressure regulators and float valves at ${resolvedBuildingName} to eliminate continuous micro-seepage.`,
      `Benchmark baseline is ${baseline} ${resource === 'electricity' ? 'kWh' : 'L'}. Operating currently at ${(ratio * 100).toFixed(0)}% of expected target.`
    ]

    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey) {
      try {
        const prompt = `You are the EcoOps Campus Sustainability AI. A facility telemetry reading was just recorded:
Building: ${resolvedBuildingName}
Location: ${location || 'Campus Facilities'}
Equipment: ${equipment || 'General Utilities'}
Resource: ${resource} (${val} vs baseline ${baseline})
Occupancy: ${occupancy || 'Normal'}
Time: ${timeOfDay || 'Daytime'}
Anomaly status: ${isAnomaly ? 'ANOMALY SPIKE DETECTED' : 'Normal'}

Provide 2 concise, highly practical energy/water saving tips.
Respond in valid JSON format ONLY:
{
  "tips": ["Tip 1", "Tip 2"]
}`
        const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash'
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
        const gemRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        })
        if (gemRes.ok) {
          const gemData = await gemRes.json()
          const text = gemData?.candidates?.[0]?.content?.parts?.[0]?.text
          const match = text?.match(/\{[\s\S]*\}/)
          if (match) {
            const parsed = JSON.parse(match[0])
            if (Array.isArray(parsed.tips) && parsed.tips.length) aiTips = parsed.tips
          }
        }
      } catch (e) {
        console.warn('[Usage] Gemini tips error:', e.message)
      }
    }

    return res.status(201).json({
      success: true,
      message: isAnomaly ? 'Reading saved. Anomaly detected and triaged by AI agent!' : 'Reading recorded successfully.',
      data: {
        reading: {
          id: reading._id.toString(),
          buildingId: reading.buildingId,
          resource: reading.resource,
          value: reading.value,
          baseline: reading.baseline,
          isAnomaly: reading.isAnomaly,
          timestamp: reading.timestamp.toISOString(),
        },
        anomaly: anomalyDoc ? { id: anomalyDoc.id, reason: anomalyDoc.reason, score: anomalyDoc.score } : null,
        aiDiagnosis,
        aiTips,
      },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

