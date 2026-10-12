import mongoose from 'mongoose'

const agentLogSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, sparse: true, index: true },
    runId: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    trigger: {
      type: String,
      enum: ['manual', 'complaint', 'anomaly'],
      default: 'manual',
    },
    step: { type: Number, default: 1 },
    thought: { type: String, required: true },
    tool: { type: String, required: true },
    result: { type: String, required: true },
    status: {
      type: String,
      enum: ['success', 'failure'],
      default: 'success',
    },
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

export const AgentLog = mongoose.model('AgentLog', agentLogSchema)
