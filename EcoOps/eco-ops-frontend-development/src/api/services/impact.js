import { api } from '../client'
import { ENDPOINTS } from '../endpoints'
import { unwrapObject } from '../adapters'

export async function getImpact() {
  return unwrapObject(await api.get(ENDPOINTS.impact), 'impact')
}
