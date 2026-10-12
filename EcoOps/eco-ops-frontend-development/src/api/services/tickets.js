import { api } from '../client'
import { ENDPOINTS } from '../endpoints'
import { unwrapList, unwrapObject } from '../adapters'

export async function listTickets() {
  return unwrapList(await api.get(ENDPOINTS.tickets), 'tickets')
}

export async function createTicket(fields) {
  const payload = {
    ...fields,
    recommendedAction: fields.recommendedAction || fields.action || '',
  }
  return unwrapObject(await api.post(ENDPOINTS.tickets, payload), 'ticket')
}

export async function updateTicket(id, changes) {
  return unwrapObject(await api.patch(ENDPOINTS.ticket(id), changes), 'ticket')
}
