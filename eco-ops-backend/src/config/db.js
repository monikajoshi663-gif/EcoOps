import mongoose from 'mongoose'

export async function connectDB() {
  const primaryUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecoops'
  const fallbackUri = 'mongodb://localhost:27017/ecoops'

  try {
    const conn = await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 1500 })
    console.log(`[MongoDB] Connected to: ${conn.connection.host}/${conn.connection.name}`)
    return conn
  } catch (error) {
    if (primaryUri !== fallbackUri) {
      console.warn(`[MongoDB] Primary connection (${primaryUri.includes('mongodb+srv') ? 'Atlas' : primaryUri}) failed: ${error.message}`)
      console.warn('[MongoDB] Connecting to local MongoDB fallback...')
      try {
        const localConn = await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 2000 })
        console.log(`[MongoDB] Connected to local fallback: ${localConn.connection.host}/${localConn.connection.name}`)
        return localConn
      } catch (localErr) {
        console.error(`[MongoDB] Local fallback failed: ${localErr.message}`)
      }
    }
    throw error
  }
}
