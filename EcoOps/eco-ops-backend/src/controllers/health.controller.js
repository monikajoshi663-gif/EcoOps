import mongoose from 'mongoose'

export async function getHealth(req, res) {
  const isDbConnected = mongoose.connection.readyState === 1
  const timestamp = new Date().toISOString()

  if (isDbConnected) {
    return res.status(200).json({
      success: true,
      data: {
        api: 'ok',
        database: 'connected',
        timestamp,
      },
    })
  }

  return res.status(503).json({
    success: false,
    message: 'Database is disconnected',
    data: {
      api: 'ok',
      database: 'disconnected',
      timestamp,
    },
  })
}
