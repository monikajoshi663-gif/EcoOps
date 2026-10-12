import { api } from '../client'
import { ENDPOINTS } from '../endpoints'
import { unwrapList, unwrapObject } from '../adapters'

export async function listComplaints() {
  return unwrapList(await api.get(ENDPOINTS.complaints), 'complaints')
}

// Sent as multipart/form-data so the optional photo travels with the complaint.
export async function createComplaint({ userId, type, buildingId, location, description, image, photo }) {
  const form = new FormData()
  if (userId) form.append('userId', userId)
  if (type) form.append('type', type)
  if (buildingId) form.append('buildingId', buildingId)
  if (location) form.append('location', location)
  if (description) form.append('description', description)
  const file = photo || image
  if (file) {
    form.append('photo', file)
  }
  return unwrapObject(await api.post(ENDPOINTS.complaints, form), 'complaint')
}
