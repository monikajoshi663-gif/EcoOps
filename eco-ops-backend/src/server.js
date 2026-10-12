import 'dotenv/config'
import app from './app.js'
import { connectDB } from './config/db.js'
import { seedDatabase } from './services/seedService.js'

const PORT = process.env.PORT || 5000

async function start() {
  try {
    await connectDB()
    await seedDatabase()
    app.listen(PORT, () => {
      console.log(`[Server] EcoOps backend running on http://localhost:${PORT}`)
      console.log(`[Server] Health: http://localhost:${PORT}/api/health`)
    })
  } catch (err) {
    console.error('[Server] Startup failed:', err.message)
    process.exit(1)
  }
}

start()
