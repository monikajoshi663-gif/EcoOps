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
