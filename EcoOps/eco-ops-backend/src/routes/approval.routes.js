import { Router } from 'express'
import { getApprovals, decideApproval } from '../controllers/approval.controller.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)
router.get('/', requireRole('admin'), getApprovals)
router.post('/:id/decision', requireRole('admin'), decideApproval)
export default router
