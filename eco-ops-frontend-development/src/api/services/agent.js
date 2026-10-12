import { api } from '../client'
import { ENDPOINTS } from '../endpoints'
import { unwrapList } from '../adapters'

export async function runAgent() {
  return api.post(ENDPOINTS.agentRun, { trigger: 'manual' })
}

export async function getAgentLogs() {
  return unwrapList(await api.get(ENDPOINTS.agentLogs), 'logs')
}

export async function chatWithAgent(message, history = []) {
  return api.post(ENDPOINTS.agentChat, { message, history })
}
