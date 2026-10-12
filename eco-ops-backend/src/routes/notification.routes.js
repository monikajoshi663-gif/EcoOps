import { Router } from 'express'
import { getNotifications, markNotificationRead } from '../controllers/notification.controller.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)
router.get('/', getNotifications)
router.patch('/:id', markNotificationRead)
export default router
