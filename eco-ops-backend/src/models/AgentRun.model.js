import mongoose from 'mongoose'

const agentRunSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, sparse: true, index: true },
    trigger: {
      type: String,
      enum: ['manual', 'complaint', 'anomaly'],
      default: 'manual',
    },
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed'],
      default: 'queued',
      index: true,
    },
    summary: { type: String, default: '' },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret.id || ret._id.toString()
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  }
)

export const AgentRun = mongoose.model('AgentRun', agentRunSchema)
