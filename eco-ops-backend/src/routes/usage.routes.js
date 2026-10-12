import { Router } from 'express'
import { getUsage, generateUsage, recordUsage } from '../controllers/usage.controller.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'

const router = Router()
router.get('/', getUsage)
router.post('/', recordUsage)
router.post('/record', recordUsage)
router.post('/generate', authMiddleware, generateUsage)
export default router
