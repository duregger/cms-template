import { Router } from 'express'
import { getProjectSettings } from './controller'

const router = Router()

router.get('/', getProjectSettings)

export default router
