import { Router } from 'express'
import { getBuildings } from '../controllers/building.controller.js'

const router = Router()
router.get('/', getBuildings)
export default router
