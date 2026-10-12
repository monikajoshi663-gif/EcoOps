import { Notification } from '../models/Notification.model.js'

export async function getNotifications(req, res) {
  try {
    const { unreadOnly, limit = 50 } = req.query
    const userId = req.user?.id || req.headers['x-demo-user-id'] || 'demo-admin'
    const limitNum = Math.min(100, parseInt(limit, 10) || 50)

    const filter = { to: userId }
    if (unreadOnly === 'true') filter.read = false

    const items = await Notification.find(filter).sort({ createdAt: -1 }).limit(limitNum)
    const unreadCount = await Notification.countDocuments({ to: userId, read: false })

    return res.json({
      success: true,
      data: {
        items: items.map(n => ({
          id: n.id || n._id.toString(),
          to: n.to,
          message: n.message,
          type: n.type,
          read: n.read,
          createdAt: n.createdAt?.toISOString(),
        })),
        unreadCount,
      },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export async function markNotificationRead(req, res) {
  try {
    const { id } = req.params
    const { read } = req.body
    const userId = req.user?.id || req.headers['x-demo-user-id'] || 'demo-admin'

    const notif = await Notification.findOne({ $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] })
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' })
    if (notif.to !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    notif.read = read !== undefined ? Boolean(read) : true
    await notif.save()
    return res.json({ success: true, data: { notification: notif.toJSON() } })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
