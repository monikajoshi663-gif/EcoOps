import mongoose from 'mongoose'

const ATLAS_URI = 'mongodb+srv://tomarharshwardhansingh40_db_user:tomarharshwardhansingh40_db_user@cluster0.fnp8mai.mongodb.net/ecoops?retryWrites=true&w=majority&appName=skillpath'
const LOCAL_URI = 'mongodb://localhost:27017/ecoops'

export async function connectDB() {
  const primaryUri = process.env.MONGO_URI || ATLAS_URI
  const fallbackUri = primaryUri === LOCAL_URI ? ATLAS_URI : LOCAL_URI

  try {
    const conn = await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 2500 })
    console.log(`[MongoDB] Connected to: ${conn.connection.host}/${conn.connection.name}`)
    return conn
  } catch (error) {
    console.warn(`[MongoDB] Primary connection failed: ${error.message}`)
    console.warn(`[MongoDB] Attempting fallback to ${fallbackUri.includes('mongodb+srv') ? 'Atlas' : 'local MongoDB'}...`)
    try {
      const fallbackConn = await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 2500 })
      console.log(`[MongoDB] Connected to fallback: ${fallbackConn.connection.host}/${fallbackConn.connection.name}`)
      return fallbackConn
    } catch (fallbackErr) {
      console.error(`[MongoDB] Both MongoDB connection attempts failed: ${fallbackErr.message}`)
      throw error
    }
  }
}
