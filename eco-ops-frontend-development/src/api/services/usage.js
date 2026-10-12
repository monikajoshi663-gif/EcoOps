import { api } from '../client'
import { ENDPOINTS } from '../endpoints'
import { unwrapList } from '../adapters'

export async function getUsage({ building, buildingId, resource, range } = {}) {
  const bId = buildingId || building
  return unwrapList(await api.get(ENDPOINTS.usage, { building: bId, buildingId: bId, resource, range }), 'series')
}
