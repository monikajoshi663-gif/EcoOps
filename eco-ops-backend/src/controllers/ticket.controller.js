import { Ticket } from '../models/Ticket.model.js'
import { Notification } from '../models/Notification.model.js'
import { IMPACT_ASSUMPTIONS } from '../config/constants.js'

function calcImpact(ticket) {
  // Deterministic impact based on priority and resource type
  const { electricityTariffInrPerKwh, waterCostInrPerLitre, electricityEmissionKgCo2PerKwh, waterEmissionKgCo2PerLitre } = IMPACT_ASSUMPTIONS
  const multiplier = { low: 1, medium: 3, high: 8, critical: 15 }[ticket.priority] || 3
  const isWater = ticket.cause?.toLowerCase().includes('water') || ticket.issue?.toLowerCase().includes('water') || ticket.location?.toLowerCase().includes('water')
  let electricitySavedKwh = 0
  let waterSavedLitres = 0

  if (isWater) {
    waterSavedLitres = multiplier * 120
  } else {
    electricitySavedKwh = multiplier * 4.5
  }

  const moneySavedInr = Math.round((electricitySavedKwh * electricityTariffInrPerKwh + waterSavedLitres * waterCostInrPerLitre) * 10) / 10
  const co2AvoidedKg = Math.round((electricitySavedKwh * electricityEmissionKgCo2PerKwh + waterSavedLitres * waterEmissionKgCo2PerLitre) * 100) / 100

  return { electricitySavedKwh, waterSavedLitres, moneySavedInr, co2AvoidedKg }
}

export async function getTickets(req, res) {
  try {
    const { status, priority, buildingId, assignee, page = 1, limit = 20 } = req.query
    const pageNum = Math.max(1, parseInt(page, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)))
    const filter = {}
    if (status) filter.status = status
    if (priority) filter.priority = priority
    if (buildingId) filter.buildingId = buildingId
    if (assignee) filter['assignee.userId'] = assignee

    if (req.user?.role === 'staff') {
      filter['assignee.userId'] = req.user.id
    }

    const total = await Ticket.countDocuments(filter)
    const items = await Ticket.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)

    return res.json({
      success: true,
      data: {
        items: items.map(t => ({
          id: t.id || t._id.toString(),
          complaintId: t.complaintId,
          buildingId: t.buildingId,
          location: t.location,
          issue: t.issue,
          priority: t.priority,
          cause: t.cause,
          recommendedAction: t.recommendedAction,
          assignee: t.assignee,
          status: t.status,
          resolutionNote: t.resolutionNote,
          impact: t.impact,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        })),
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) || 1 },
      },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export async function getTicketById(req, res) {
  try {
    const { id } = req.params
    const ticket = await Ticket.findOne({ $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] })
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' })
    return res.json({ success: true, data: { ticket: ticket.toJSON() } })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export async function createTicket(req, res) {
  try {
    const { buildingId, location, issue, priority, cause, recommendedAction, assigneeTeam } = req.body
    if (!buildingId || !location || !issue) {
      return res.status(400).json({ success: false, message: 'buildingId, location, and issue are required' })
    }
    const ticketId = `ticket-${Date.now()}`
    const ticket = await Ticket.create({
      id: ticketId,
      buildingId,
      location,
      issue,
      priority: priority || 'medium',
      cause: cause || '',
      recommendedAction: recommendedAction || '',
      assignee: { team: assigneeTeam || 'facilities', userId: 'demo-staff', name: 'Facilities Staff' },
      status: 'assigned',
    })
    await Notification.create({
      id: `notif-${Date.now()}`,
      to: 'demo-staff',
      message: `New ticket assigned: ${issue} at ${location}`,
      type: 'ticket_assigned',
    })
    return res.status(201).json({ success: true, data: { ticket: ticket.toJSON() } })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export async function patchTicket(req, res) {
  try {
    const { id } = req.params
    const { status, resolutionNote } = req.body
    const ticket = await Ticket.findOne({ $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] })
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' })

    if (status === 'resolved' && !resolutionNote?.trim()) {
      return res.status(400).json({ success: false, message: 'A resolutionNote is required when resolving a ticket.' })
    }

    if (status) ticket.status = status
    if (resolutionNote) ticket.resolutionNote = resolutionNote

    if (status === 'resolved') {
      ticket.impact = calcImpact(ticket)
      await Notification.create({
        id: `notif-${Date.now()}`,
        to: 'demo-admin',
        message: `Ticket #${ticket.id} resolved: ${ticket.issue}`,
        type: 'ticket_resolved',
      })
    }

    await ticket.save()
    return res.json({ success: true, data: { ticket: ticket.toJSON() } })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
