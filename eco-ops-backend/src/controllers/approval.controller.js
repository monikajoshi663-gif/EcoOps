import { Approval } from '../models/Approval.model.js'
import { Ticket } from '../models/Ticket.model.js'

export async function getApprovals(req, res) {
  try {
    const { status } = req.query
    const filter = {}
    if (status) filter.status = status
    const items = await Approval.find(filter).sort({ requestedAt: -1 })
    return res.json({
      success: true,
      data: {
        items: items.map(a => ({
          id: a.id || a._id.toString(),
          ticketId: a.ticketId,
          action: a.action,
          reason: a.reason,
          status: a.status,
          requestedAt: a.requestedAt?.toISOString(),
          decidedAt: a.decidedAt?.toISOString() || null,
          decidedBy: a.decidedBy,
          decisionNote: a.decisionNote,
        })),
      },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export async function decideApproval(req, res) {
  try {
    const { id } = req.params
    const { decision, decisionNote } = req.body
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'decision must be "approved" or "rejected"' })
    }

    const approval = await Approval.findOne({ $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] })
    if (!approval) return res.status(404).json({ success: false, message: 'Approval not found' })
    if (approval.status !== 'pending') {
      return res.status(409).json({ success: false, message: 'Approval has already been decided.' })
    }

    const decidedBy = req.user?.id || req.user?.name || 'demo-admin'
    approval.status = decision
    approval.decidedAt = new Date()
    approval.decidedBy = decidedBy
    approval.decisionNote = decisionNote || null
    await approval.save()

    // Update linked ticket if approved
    if (decision === 'approved' && approval.ticketId) {
      await Ticket.findOneAndUpdate(
        { $or: [{ id: approval.ticketId }, { _id: approval.ticketId.match(/^[0-9a-fA-F]{24}$/) ? approval.ticketId : null }] },
        { status: 'in_progress' }
      )
    }

    return res.json({ success: true, data: { approval: approval.toJSON() } })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
