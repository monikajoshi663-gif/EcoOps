import { Router } from 'express'
import { getTickets, getTicketById, createTicket, patchTicket } from '../controllers/ticket.controller.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)
router.get('/', getTickets)
router.get('/:id', getTicketById)
router.post('/', createTicket)
router.patch('/:id', patchTicket)
export default router
