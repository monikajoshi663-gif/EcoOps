import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

// Routes
import healthRoutes from './routes/health.routes.js'
import authRoutes from './routes/auth.routes.js'
import buildingRoutes from './routes/building.routes.js'
import usageRoutes from './routes/usage.routes.js'
import anomalyRoutes from './routes/anomaly.routes.js'
import complaintRoutes from './routes/complaint.routes.js'
import ticketRoutes from './routes/ticket.routes.js'
import approvalRoutes from './routes/approval.routes.js'
import notificationRoutes from './routes/notification.routes.js'
import impactRoutes from './routes/impact.routes.js'
import agentRoutes from './routes/agent.routes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

// CORS
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s => s.trim())
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// API Routes
app.use('/api/health', healthRoutes)
app.use('/api', authRoutes)                        // /api/demo/users, /api/auth/*
app.use('/api/buildings', buildingRoutes)
app.use('/api/usage', usageRoutes)
app.use('/api/anomalies', anomalyRoutes)
app.use('/api/complaints', complaintRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/approvals', approvalRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/impact', impactRoutes)
app.use('/api/agent', agentRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message)
  const status = err.status || 500
  res.status(status).json({ success: false, message: err.message || 'Internal server error' })
})

export default app
