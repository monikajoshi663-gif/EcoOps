import mongoose from 'mongoose'

export async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecoops'
  try {
    const conn = await mongoose.connect(uri)
    console.log(`[MongoDB] Connected to: ${conn.connection.host}/${conn.connection.name}`)
    return conn
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`)
    throw error
  }
}
