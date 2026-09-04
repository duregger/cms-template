import * as admin from 'firebase-admin'
import { onRequest } from 'firebase-functions/v2/https'
import express from 'express'
import cors from 'cors'
import notificationsRouter from './alerts/routes'

admin.initializeApp()

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

app.use('/api/notifications', notificationsRouter)

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'CMS API is running' })
})

export const api = onRequest({ invoker: 'public' }, app)
