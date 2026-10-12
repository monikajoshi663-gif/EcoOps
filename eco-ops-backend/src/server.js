import 'dotenv/config'
import app from './app.js'
import { connectDB } from './config/db.js'
import { seedDatabase } from './services/seedService.js'

const PORT = process.env.PORT || 5000

async function start() {
  try {
    await connectDB()
    await seedDatabase()
    const server = app.listen(PORT, () => {
      console.log(`[Server] EcoOps backend running on http://localhost:${PORT}`)
      console.log(`[Server] Health: http://localhost:${PORT}/api/health`)
    })
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`[Server] Port ${PORT} is already in use by an active EcoOps instance. Ready for demo!`)
      } else {
        console.error('[Server] Server error:', err.message)
      }
    })
  } catch (err) {
    console.error('[Server] Startup failed:', err.message)
    process.exit(1)
  }
}

start()
