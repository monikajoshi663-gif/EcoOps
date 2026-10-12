import { api } from '../client'
import { ENDPOINTS } from '../endpoints'
import { unwrapList, unwrapObject } from '../adapters'

export async function listNotifications() {
  return unwrapList(await api.get(ENDPOINTS.notifications), 'notifications')
}

export async function markNotificationRead(id) {
  try {
    return unwrapObject(await api.patch(ENDPOINTS.notification(id), { read: true }), 'notification')
  } catch {
    return unwrapObject(await api.patch(ENDPOINTS.notificationRead(id)), 'notification')
  }
}
