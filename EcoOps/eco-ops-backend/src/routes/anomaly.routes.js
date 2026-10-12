import { Router } from 'express'
import { getAnomalies } from '../controllers/anomaly.controller.js'

const router = Router()
router.get('/', getAnomalies)
export default router
