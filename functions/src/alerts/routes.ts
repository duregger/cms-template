import { Router } from 'express'
import {
  listNotifications,
  getNotification,
  createNotification,
  updateNotification,
  deleteNotification,
  publishNotification,
} from './controller'

const router = Router()

router.get('/', listNotifications)
router.get('/:id', getNotification)
router.post('/', createNotification)
router.put('/:id', updateNotification)
router.delete('/:id', deleteNotification)
router.post('/:id/publish', publishNotification)

export default router
