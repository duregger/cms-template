import { Router } from 'express'
import { getPage, listPages } from './controller'

const router = Router()

router.get('/:space/:slug', getPage)
router.get('/:space', listPages)

export default router
