import { Router } from 'express'
import { getDemoUsers, register, login, getMe, logout } from '../controllers/auth.controller.js'
import { authMiddleware, requireAuth } from '../middleware/auth.js'

const router = Router()
router.get('/demo/users', getDemoUsers)
router.post('/auth/register', register)
router.post('/auth/login', login)
router.post('/auth/logout', logout)
router.get('/auth/me', authMiddleware, requireAuth, getMe)
export default router
