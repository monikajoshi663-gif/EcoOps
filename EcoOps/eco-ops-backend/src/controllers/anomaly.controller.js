import { Anomaly } from '../models/Anomaly.model.js'

export async function getAnomalies(req, res) {
  try {
    const { building, buildingId, resource, status, from, to } = req.query
    const targetBuilding = buildingId || building

    const filter = {}
    if (targetBuilding) filter.buildingId = targetBuilding
    if (resource && (resource === 'electricity' || resource === 'water')) filter.resource = resource
    if (status) filter.status = status

    if (from || to) {
      filter.timestamp = {}
      if (from) filter.timestamp.$gte = new Date(from)
      if (to) filter.timestamp.$lte = new Date(to)
    }

    const items = await Anomaly.find(filter).sort({ timestamp: -1 })

    return res.status(200).json({
      success: true,
      data: {
        items: items.map((a) => ({
          id: a.id || a._id.toString(),
          buildingId: a.buildingId,
          buildingName: a.buildingName,
          resource: a.resource,
          timestamp: a.timestamp.toISOString(),
          observedValue: a.observedValue,
          baselineValue: a.baselineValue,
          score: a.score,
          reason: a.reason,
          status: a.status,
        })),
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
