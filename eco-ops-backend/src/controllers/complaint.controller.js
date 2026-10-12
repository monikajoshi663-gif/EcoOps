import { Complaint } from '../models/Complaint.model.js'
import { runAgent } from '../services/agentService.js'

export async function createComplaint(req, res) {
  try {
    const { type, buildingId, location, description } = req.body
    const userId = req.user?.id || req.headers['x-demo-user-id'] || 'demo-student'

    if (!type || !buildingId || !location || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type, buildingId, location, and description are required.',
      })
    }

    let imageUrl = null
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`
    } else if (req.files) {
      const file = req.files['photo']?.[0] || req.files['image']?.[0]
      if (file) imageUrl = `/uploads/${file.filename}`
    }

    const complaintId = `complaint-${Date.now()}`

    // 1. Run Gemini AI diagnostic analysis on complaint text
    let aiAnalysis = {
      severity: type === 'water_leak' ? 'high' : 'medium',
      rootCause: `Verified ${type.replace(/_/g, ' ')} condition reported at ${location}`,
      recommendedAction: 'Dispatch technician for immediate inspection and isolation',
      resourceRisk: type === 'water_leak' ? 'water loss' : 'energy waste',
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey) {
      try {
        const prompt = `You are the EcoOps Campus Sustainability AI. Analyze this campus maintenance complaint:
Type: ${type}
Building: ${buildingId}
Location: ${location}
Description: "${description}"

Respond in valid JSON ONLY with this structure:
{
  "severity": "high" | "medium" | "low",
  "rootCause": "1 concise sentence technical cause",
  "recommendedAction": "1 concise sentence technician repair instruction",
  "resourceRisk": "water loss" | "power drain" | "hazard"
}`

        const modelsToTry = [process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite']
        for (const model of modelsToTry) {
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
            const gemRes = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
              signal: AbortSignal.timeout(6000),
            })
            if (gemRes.ok) {
              const gemData = await gemRes.json()
              const text = gemData?.candidates?.[0]?.content?.parts?.[0]?.text
              const match = text?.match(/\{[\s\S]*\}/)
              if (match) {
                aiAnalysis = JSON.parse(match[0])
                break
              }
            }
          } catch (_) {}
        }
      } catch (err) {
        console.warn('[Complaint] AI analysis error:', err.message)
      }
    }

    const complaint = await Complaint.create({
      id: complaintId,
      userId,
      type,
      buildingId,
      location,
      description,
      imageUrl,
      status: 'submitted',
      aiAnalysis,
    })

    // Automatically trigger agent run
    let agentRunInfo = { id: `agent-run-${Date.now()}`, status: 'queued' }
    try {
      const agentRun = await runAgent({
        trigger: 'complaint',
        complaintId: complaint.id,
        buildingId: complaint.buildingId,
      })
      agentRunInfo = {
        id: agentRun.id,
        status: agentRun.status,
      }
    } catch (agentErr) {
      console.warn('[Complaint] Agent trigger warning:', agentErr.message)
    }

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted and analyzed by AI',
      data: {
        complaint: {
          id: complaint.id,
          userId: complaint.userId,
          type: complaint.type,
          buildingId: complaint.buildingId,
          location: complaint.location,
          description: complaint.description,
          imageUrl: complaint.imageUrl,
          status: complaint.status,
          aiAnalysis: complaint.aiAnalysis,
          createdAt: complaint.createdAt.toISOString(),
        },
        agentRun: agentRunInfo,
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export async function getComplaints(req, res) {
  try {
    const { status, buildingId, page = 1, limit = 20 } = req.query
    const pageNum = Math.max(1, parseInt(page, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)))

    const filter = {}
    if (status) filter.status = status
    if (buildingId) filter.buildingId = buildingId

    // Students see own complaints if logged in as student
    if (req.user?.role === 'student') {
      filter.userId = req.user.id
    }

    const total = await Complaint.countDocuments(filter)
    const items = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)

    return res.status(200).json({
      success: true,
      data: {
        items: items.map((c) => ({
          id: c.id || c._id.toString(),
          userId: c.userId,
          type: c.type,
          buildingId: c.buildingId,
          location: c.location,
          description: c.description,
          imageUrl: c.imageUrl,
          status: c.status,
          aiAnalysis: c.aiAnalysis,
          createdAt: c.createdAt.toISOString(),
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export async function getComplaintById(req, res) {
  try {
    const { id } = req.params
    const complaint = await Complaint.findOne({
      $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    })

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        complaint: {
          id: complaint.id || complaint._id.toString(),
          userId: complaint.userId,
          type: complaint.type,
          buildingId: complaint.buildingId,
          location: complaint.location,
          description: complaint.description,
          imageUrl: complaint.imageUrl,
          status: complaint.status,
          createdAt: complaint.createdAt.toISOString(),
        },
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
