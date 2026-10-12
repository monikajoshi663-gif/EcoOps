import { Ticket } from '../models/Ticket.model.js'
import { Anomaly } from '../models/Anomaly.model.js'
import { IMPACT_ASSUMPTIONS } from '../config/constants.js'

export async function getImpact(req, res) {
  try {
    const resolvedTickets = await Ticket.find({ status: 'resolved' })
    const issuesDetected = await Anomaly.countDocuments()

    let electricitySavedKwh = 0
    let waterSavedLitres = 0
    let moneySavedInr = 0
    let co2AvoidedKg = 0

    for (const t of resolvedTickets) {
      electricitySavedKwh += t.impact?.electricitySavedKwh || 0
      waterSavedLitres += t.impact?.waterSavedLitres || 0
      moneySavedInr += t.impact?.moneySavedInr || 0
      co2AvoidedKg += t.impact?.co2AvoidedKg || 0
    }

    return res.json({
      success: true,
      data: {
        issuesDetected,
        issuesResolved: resolvedTickets.length,
        electricitySavedKwh: Math.round(electricitySavedKwh * 10) / 10,
        waterSavedLitres: Math.round(waterSavedLitres),
        moneySavedInr: Math.round(moneySavedInr * 10) / 10,
        co2AvoidedKg: Math.round(co2AvoidedKg * 100) / 100,
        assumptions: IMPACT_ASSUMPTIONS,
        simulated: true,
      },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
