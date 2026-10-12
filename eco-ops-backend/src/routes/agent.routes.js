import { Router } from 'express'
import { startAgentRun, getAgentRunById, getAgentLogs, agentChat } from '../controllers/agent.controller.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)
router.post('/run', requireRole('admin'), startAgentRun)
router.get('/runs/:id', getAgentRunById)
router.get('/logs', getAgentLogs)
router.post('/chat', agentChat)
export default router
