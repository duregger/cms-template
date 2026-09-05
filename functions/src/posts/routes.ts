import { Router } from 'express'
import { getPost, listPosts } from './controller'

const router = Router()

router.get('/:space/:slug', getPost)
router.get('/:space', listPosts)

export default router
