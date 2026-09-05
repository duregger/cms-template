import * as admin from 'firebase-admin'
import { onRequest } from 'firebase-functions/v2/https'
import express from 'express'
import cors from 'cors'
import notificationsRouter from './alerts/routes'
import tokensRouter from './tokens/routes'
import pagesRouter from './pages/routes'
import settingsRouter from './settings/routes'
import { getLlmsTxt, getSitemap } from './discovery/controller'

admin.initializeApp()

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

app.use('/api/notifications', notificationsRouter)
app.use('/api/tokens', tokensRouter)
app.use('/api/pages', pagesRouter)
app.use('/api/brand', settingsRouter)

app.get('/sitemap.xml', getSitemap)
app.get('/llms.txt', getLlmsTxt)

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'CMS API is running' })
})

export const api = onRequest({ invoker: 'public' }, app)
