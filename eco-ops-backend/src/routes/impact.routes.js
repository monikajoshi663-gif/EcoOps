import { Router } from 'express'
import { getImpact } from '../controllers/impact.controller.js'

const router = Router()
router.get('/', getImpact)
export default router
