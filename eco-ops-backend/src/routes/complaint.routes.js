import { Router } from 'express'
import { createComplaint, getComplaints, getComplaintById } from '../controllers/complaint.controller.js'
import { authMiddleware } from '../middleware/auth.js'
import { uploadPhoto } from '../middleware/upload.js'

const router = Router()
router.use(authMiddleware)
router.get('/', getComplaints)
router.get('/:id', getComplaintById)
router.post('/', uploadPhoto.single('photo'), createComplaint)
export default router
