import mongoose from 'mongoose'

const approvalSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, sparse: true, index: true },
    ticketId: { type: String, default: null, index: true },
    action: { type: String, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    requestedAt: { type: Date, default: Date.now },
    decidedAt: { type: Date, default: null },
    decidedBy: { type: String, default: null },
    decisionNote: { type: String, default: null },
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

export const Approval = mongoose.model('Approval', approvalSchema)
