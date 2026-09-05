import { Router } from 'express'
import { getPublishedTokens } from './controller'

const router = Router()

router.get('/:space', getPublishedTokens)

export default router
