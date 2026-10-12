import { Router } from 'express'
import { createComplaint, getComplaints, getComplaintById } from '../controllers/complaint.controller.js'
import { authMiddleware } from '../middleware/auth.js'
import { uploadPhoto } from '../middleware/upload.js'

const router = Router()
router.use(authMiddleware)
router.get('/', getComplaints)
router.get('/:id', getComplaintById)
router.post(
  '/',
  uploadPhoto.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ]),
  createComplaint
)
export default router
