import { api } from '../client'
import { ENDPOINTS } from '../endpoints'
import { unwrapList, unwrapObject } from '../adapters'

export async function listApprovals() {
  return unwrapList(await api.get(ENDPOINTS.approvals), 'approvals')
}

export async function decideApproval(id, decision) {
  return unwrapObject(await api.post(ENDPOINTS.approvalDecision(id), { decision }), 'approval')
}
